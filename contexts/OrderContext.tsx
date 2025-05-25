import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { Order, OrderItem, OrderStatus, OrderItemStatus, SelectedModifierOption } from '../types';
import { useMenu } from './MenuContext';
import { useRecipe } from './RecipeContext'; 
import { useInventory } from './InventoryContext';
import { orderService } from '../services/firebaseService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebaseService';

interface OrderContextType {
  orders: Order[];
  addOrder: (
    orderData: {
      items: { menuItemId: string; quantity: number; selectedModifiers?: SelectedModifierOption[] }[];
      tableNumber?: string;
      pax?: number;
      status?: OrderStatus; 
      paymentMethod?: 'cash' | 'card' | 'gcash';
      amountReceived?: number;
      isPaid?: boolean;
    }
  ) => Promise<Order>;
  updateOrderItemStatus: (orderId: string, orderItemId: string, newKDSStatus: OrderItemStatus) => Promise<void>;
  updateOrderStatus: (
    orderId: string, 
    newStatus: OrderStatus, 
    paymentDetails?: { 
        paymentMethod: 'cash' | 'card' | 'gcash'; 
        amountReceived?: number; 
        changeGiven?: number; 
        isPaid: boolean;
    }
  ) => Promise<void>;
  getOrdersByStatus: (statuses: OrderStatus[]) => Order[];
  getOrderById: (orderId: string) => Order | undefined;
  generateTokenNumber: () => string;
  updateHeldOrder: (
    orderId: string, 
    updatedData: {
      items: OrderItem[];
      tableNumber?: string;
      pax?: number;
      paymentMethod?: 'cash' | 'card' | 'gcash'; 
      amountReceived?: number;
    }
  ) => Promise<void>;
  markOrderItemDeliveredByBar: (orderId: string, orderItemId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const determineOverallOrderStatus = (items: OrderItem[], currentOverallStatus?: OrderStatus): OrderStatus => {
    if (currentOverallStatus === OrderStatus.ON_HOLD) return OrderStatus.ON_HOLD;
    if (currentOverallStatus === OrderStatus.COMPLETED) return OrderStatus.COMPLETED;
    if (currentOverallStatus === OrderStatus.CANCELLED) return OrderStatus.CANCELLED;

    const activeKDSItems = items.filter(item => item.status !== OrderItemStatus.CANCELLED);
    if (activeKDSItems.length === 0 && items.length > 0) return OrderStatus.CANCELLED;

    const allKDSItemsReady = activeKDSItems.every(item => item.status === OrderItemStatus.READY || item.status === OrderItemStatus.AWAITING_DELIVERY || item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER);
    const allKDSItemsDeliveredByBar = activeKDSItems.every(item => item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER);
    
    if (allKDSItemsReady && allKDSItemsDeliveredByBar) return OrderStatus.COMPLETED;
    if (allKDSItemsReady && activeKDSItems.some(item => item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER)) return OrderStatus.DELIVERY_IN_PROGRESS;
    if (allKDSItemsReady) return OrderStatus.READY_FOR_DELIVERY;

    if (activeKDSItems.some(item => item.status === OrderItemStatus.PREPARING)) return OrderStatus.PREPARING;
    if (activeKDSItems.some(item => item.status === OrderItemStatus.READY || item.status === OrderItemStatus.AWAITING_DELIVERY) && 
        activeKDSItems.some(item => item.status === OrderItemStatus.PENDING || item.status === OrderItemStatus.PREPARING)) return OrderStatus.PARTIALLY_READY;
    
    if (items.every(item => item.status === OrderItemStatus.PENDING)) return OrderStatus.PENDING;

    return currentOverallStatus || OrderStatus.PENDING;
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { getMenuItemById } = useMenu();
  const { getRecipeByMenuItemId } = useRecipe();
  const { deductIngredientStock } = useInventory();
  const [lastTokenDate, setLastTokenDate] = useState<string>('');
  const [lastTokenCounter, setLastTokenCounter] = useState<number>(0);

  // Set up real-time listener for all orders
  useEffect(() => {
    // Create a query to get all orders
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('orderTime', 'desc')
    );

    // Set up the real-time listener
    const unsubscribe = onSnapshot(ordersQuery, 
      (snapshot) => {
        const updatedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
        // Update the orders state with the latest data
        setOrders(updatedOrders);
        
        // Log for debugging
        logger.error(`Orders updated: ${updatedOrders.length} orders received`);
      },
      (error) => {
        logger.error(`Error in orders real-time listener: ${error}`);
      }
    );

    // Initial fetch of orders
    const fetchInitialOrders = async () => {
      try {
        const fetchedOrders = await orderService.getAll();
        setOrders(fetchedOrders);
      } catch (error) {
        logger.error(`Error fetching initial orders: ${error}`);
      }
    };

    fetchInitialOrders();

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const fetchedOrders = await orderService.getAll();
      setOrders(fetchedOrders);
    } catch (error) {
      logger.error(`Error refreshing orders: ${error}`);
    }
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const generateTokenNumber = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]; 
    let counter = lastTokenCounter;
    if (lastTokenDate !== today) {
      counter = 1;
      setLastTokenDate(today);
    } else {
      counter++;
    }
    setLastTokenCounter(counter);
    return String(counter).padStart(3, '0');
  }, [lastTokenDate, lastTokenCounter]);

  const performInventoryDeduction = useCallback((orderItems: OrderItem[]) => {
    orderItems.forEach(orderItem => {
      const recipe = getRecipeByMenuItemId(orderItem.menuItemId);
      if (recipe) {
        recipe.items.forEach(recipeIngredient => {
          const totalToDeduct = recipeIngredient.quantity * orderItem.quantity;
          deductIngredientStock(recipeIngredient.ingredientId, totalToDeduct);
        });
      }
    });
  }, [getRecipeByMenuItemId, deductIngredientStock]);

  const addOrder = useCallback(async (orderData: {
    items: { menuItemId: string; quantity: number; selectedModifiers?: SelectedModifierOption[] }[];
    tableNumber?: string;
    pax?: number;
    status?: OrderStatus;
    paymentMethod?: 'cash' | 'card' | 'gcash';
    amountReceived?: number;
    isPaid?: boolean;
  }): Promise<Order> => {
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dailyOrderCount = orders.filter(o => o.orderTime && new Date(o.orderTime).toDateString() === now.toDateString()).length + 1;
      const internalOrderNumber = `${yyyy}${mm}${dd}-${String(dailyOrderCount).padStart(4, '0')}`;
      
      const customerTokenNumber = (orderData.status === OrderStatus.ON_HOLD && !orderData.isPaid) 
                                  ? 'HELD' 
                                  : generateTokenNumber();

      let totalAmount = 0;
      const newOrderItems: OrderItem[] = orderData.items.map(itemData => {
        const menuItem = getMenuItemById(itemData.menuItemId);
        if (!menuItem) throw new Error(`Menu item with ID ${itemData.menuItemId} not found.`);
        
        let itemSubTotal = menuItem.price * itemData.quantity;
        if (itemData.selectedModifiers) {
          itemData.selectedModifiers.forEach(mod => {
            itemSubTotal += mod.priceChange * itemData.quantity;
          });
        }
        totalAmount += itemSubTotal;

        return {
          id: uuidv4(),
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          quantity: itemData.quantity,
          priceAtOrder: menuItem.price, 
          status: OrderItemStatus.PENDING, 
          selectedModifiers: itemData.selectedModifiers || [],
        };
      });

      const changeGiven = (orderData.paymentMethod === 'cash' && orderData.amountReceived && totalAmount > 0) 
                          ? Math.max(0, orderData.amountReceived - totalAmount) 
                          : undefined;
      
      const newOrder: Order = {
        id: uuidv4(),
        orderNumber: internalOrderNumber,
        tokenNumber: customerTokenNumber,
        items: newOrderItems,
        status: orderData.status || OrderStatus.PENDING,
        totalAmount,
        orderTime: now,
        tableNumber: orderData.tableNumber || '',
        pax: orderData.pax || undefined,
        paymentMethod: orderData.paymentMethod,
        amountReceived: orderData.amountReceived,
        changeGiven: changeGiven,
        isPaid: orderData.isPaid || false,
        lastKDSNotifiedTime: Date.now(),
      };

      if (newOrder.isPaid && newOrder.status !== OrderStatus.ON_HOLD) {
        performInventoryDeduction(newOrder.items);
      }

      // Create the order in Firestore first
      const orderId = await orderService.create(newOrder);
      const createdOrder = { ...newOrder, id: orderId };
      
      // Only update state after successful Firestore creation
      setOrders(prev => {
        // Remove any existing order with the same ID to prevent duplicates
        const filteredOrders = prev.filter(o => o.id !== orderId);
        return [createdOrder, ...filteredOrders];
      });
      
      return createdOrder;
    } catch (error) {
      logger.error(`Error adding order: ${error}`);
      throw error;
    }
  }, [orders, getMenuItemById, generateTokenNumber, performInventoryDeduction]);

  const updateOrderItemStatus = useCallback(async (orderId: string, orderItemId: string, newKDSStatus: OrderItemStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        logger.error(`Order ${orderId} not found when trying to update item status`);
        return;
      }

      // First verify the order exists in Firestore
      const existingOrder = await orderService.get(orderId);
      if (!existingOrder) {
        logger.error(`Order ${orderId} not found in Firestore when trying to update item status`);
        // Create the order in Firestore if it doesn't exist
        await orderService.create(order);
      }

      const updatedItems = order.items.map(item => {
        if (item.id === orderItemId) {
          const statusForBarPerspective = newKDSStatus === OrderItemStatus.READY && item.status !== OrderItemStatus.DELIVERED_TO_CUSTOMER 
                                          ? OrderItemStatus.AWAITING_DELIVERY 
                                          : newKDSStatus;
          return { ...item, status: statusForBarPerspective };
        }
        return item;
      });

      const newOverallStatus = determineOverallOrderStatus(updatedItems, order.status);
      const updatedOrder = { ...order, items: updatedItems, status: newOverallStatus };
      
      // Update in Firestore
      await orderService.update(orderId, updatedOrder);
      
      // Update local state
      setOrders(prev => {
        const filteredOrders = prev.filter(o => o.id !== orderId);
        return [updatedOrder, ...filteredOrders];
      });
    } catch (error) {
      logger.error(`Error updating order item status: ${error}`);
      throw error;
    }
  }, [orders]);

  const updateOrderStatus = useCallback(async (
    orderId: string, 
    newStatus: OrderStatus, 
    paymentDetails?: { 
      paymentMethod: 'cash' | 'card' | 'gcash'; 
      amountReceived?: number; 
      changeGiven?: number; 
      isPaid: boolean;
    }
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder = {
      ...order,
      status: newStatus,
      ...(paymentDetails && {
        paymentMethod: paymentDetails.paymentMethod,
        amountReceived: paymentDetails.amountReceived,
        changeGiven: paymentDetails.changeGiven,
        isPaid: paymentDetails.isPaid
      })
    };

    if (paymentDetails?.isPaid && newStatus !== OrderStatus.ON_HOLD) {
      performInventoryDeduction(order.items);
    }

    await orderService.update(orderId, updatedOrder);
    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
  }, [orders, performInventoryDeduction]);

  const updateHeldOrder = useCallback(async (
    orderId: string, 
    updatedData: {
      items: OrderItem[];
      tableNumber?: string;
      pax?: number;
      paymentMethod?: 'cash' | 'card' | 'gcash'; 
      amountReceived?: number;
    }
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== OrderStatus.ON_HOLD) return;

    let newTotalAmount = 0;
    updatedData.items.forEach(item => {
      let itemSubTotal = item.priceAtOrder * item.quantity;
      if (item.selectedModifiers) {
        item.selectedModifiers.forEach(mod => {
          itemSubTotal += mod.priceChange * item.quantity;
        });
      }
      newTotalAmount += itemSubTotal;
    });

    const updatedOrder = {
      ...order,
      items: updatedData.items,
      tableNumber: updatedData.tableNumber,
      pax: updatedData.pax,
      paymentMethod: updatedData.paymentMethod,
      amountReceived: updatedData.amountReceived,
      totalAmount: newTotalAmount
    };

    await orderService.update(orderId, updatedOrder);
    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
  }, [orders]);

  const markOrderItemDeliveredByBar = useCallback(async (orderId: string, orderItemId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item =>
      item.id === orderItemId ? { ...item, status: OrderItemStatus.DELIVERED_TO_CUSTOMER } : item
    );
    const newOverallStatus = determineOverallOrderStatus(updatedItems, order.status);
    const updatedOrder = { ...order, items: updatedItems, status: newOverallStatus };

    await orderService.update(orderId, updatedOrder);
    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
  }, [orders]);

  const getOrdersByStatus = useCallback((statuses: OrderStatus[]) => {
    return orders.filter(order => statuses.includes(order.status));
  }, [orders]);

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  return (
    <OrderContext.Provider value={{
      orders,
      addOrder,
      updateOrderItemStatus,
      updateOrderStatus,
      getOrdersByStatus,
      getOrderById,
      generateTokenNumber,
      updateHeldOrder,
      markOrderItemDeliveredByBar,
      refreshOrders
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
