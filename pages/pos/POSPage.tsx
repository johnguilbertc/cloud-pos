import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOrder } from '../../contexts/OrderContext';
import { useMenu } from '../../contexts/MenuContext';
import { useSettings } from '../../contexts/SettingsContext'; // New import
import { MenuItem, Order, OrderItemStatus, OrderStatus, OrderItem as OrderItemType, Category, MenuItemModifierGroup, MenuItemModifierOption, SelectedModifierOption } from '../../types';
import { PlusIcon, PrinterIcon, CreditCardIcon, CurrencyDollarIcon, PauseCircleIcon, TableCellsIcon, UsersIcon as PaxIcon, TrashIcon as ClearIcon, ArchiveBoxIcon, BellIcon, SquareIcon, CheckSquareIcon, EditIcon } from '../../components/icons/Icons';
import Modal from '../../components/Modal'; 
import { DEFAULT_MENU_IMAGE } from '../../constants'; // CAFE_DETAILS removed from direct import here
import LoadingSpinner from '../../components/LoadingSpinner';

type PaymentMethod = 'cash' | 'card' | 'gcash';

const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | 0, c === 'x' ? Math.random() * 16 | 0 : (Math.random() * 16 | 0 & 0x3 | 0x8)).toString(16));

const philippineDenominations: number[] = [1, 5, 20, 50, 100, 200, 500, 1000].sort((a,b) => a-b);

const calculateTotalItemQuantity = (items: OrderItemType[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

const POSPage: React.FC = () => {
  const { orders, addOrder, updateOrderStatus, getOrderById, updateHeldOrder } = useOrder();
  const { menuItems, categories, getMenuItemById, getCategoryById } = useMenu(); // Added getCategoryById
  const { settings: cafeSettings } = useSettings(); // Use settings context
  
  const initialOrderDataState: Partial<Order> & { tableNumber: string, pax: number } = { 
    tableNumber: '', 
    pax: 1,
    items: [],
  };
  const [currentOrderData, setCurrentOrderData] = useState<Partial<Order> & { tableNumber: string, pax: number }>(initialOrderDataState);
  const [currentOrderItemsLocal, setCurrentOrderItemsLocal] = useState<OrderItemType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalPaymentMethod, setModalPaymentMethod] = useState<PaymentMethod>('cash');
  const [modalAmountReceivedInput, setModalAmountReceivedInput] = useState<string>('');

  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);

  // --- Modifier Modal State ---
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);
  const [selectedModifiersState, setSelectedModifiersState] = useState<Record<string, SelectedModifierOption[]>>({});

  // --- Success Modal State ---
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [placedOrderForSuccessModal, setPlacedOrderForSuccessModal] = useState<Order | null>(null);

  // --- Recent Orders Modal State ---
  const [isRecentOrderDetailModalOpen, setIsRecentOrderDetailModalOpen] = useState(false);
  const [selectedRecentOrderForDetail, setSelectedRecentOrderForDetail] = useState<Order | null>(null);

  // Add loading state for order submission
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    if (orderToPrint) {
      const timer = setTimeout(() => {
        const receiptWrapper = document.getElementById('receipt-content-wrapper');
        if (receiptWrapper) {
          try {
            // Clear existing content safely
            while (receiptWrapper.firstChild) {
              receiptWrapper.removeChild(receiptWrapper.firstChild);
            }
            
            const totalItemsQuantity = calculateTotalItemQuantity(orderToPrint.items);
            let receiptHTML = `<div class="text-center mb-2">
                <h2 class="text-lg font-bold">${cafeSettings.companyName}</h2>
                <p class="text-xs">${cafeSettings.address}</p>
                <p class="text-xs">${cafeSettings.phone}</p>
                <p class="text-xs">TIN: ${cafeSettings.tin}</p>
            </div>
            <hr class="my-1 border-dashed"/>
            <p class="text-xs">Date: ${new Date(orderToPrint.orderTime).toLocaleString()}</p>
            <p class="text-xs">Order #: ${orderToPrint.orderNumber} | Token: <span class="font-bold text-base">${orderToPrint.tokenNumber}</span></p>
            <p class="total-items-receipt">Total Items: ${totalItemsQuantity}</p>
            ${orderToPrint.tableNumber ? `<p class="text-xs">Table: ${orderToPrint.tableNumber}</p>` : ''}
            ${orderToPrint.pax ? `<p class="text-xs">Pax: ${orderToPrint.pax}</p>` : ''}
            <hr class="my-1 border-dashed"/>`;

            // Group items by category for receipt
            const categorizedOrderItems: { category: Category; items: OrderItemType[] }[] = [];
            const allAvailableCategories = [...categories, {id: 'uncategorized', name: 'Uncategorized', description: 'Items without a defined category'} as Category];

            allAvailableCategories.forEach(category => {
                let itemsInCategory: OrderItemType[];
                if (category.id === 'uncategorized') {
                    itemsInCategory = orderToPrint.items.filter(orderItem => {
                        const menuItem = getMenuItemById(orderItem.menuItemId);
                        if (!menuItem) return true;
                        return !categories.some(c => c.id === menuItem.categoryId);
                    });
                } else {
                    itemsInCategory = orderToPrint.items.filter(orderItem => {
                        const menuItem = getMenuItemById(orderItem.menuItemId);
                        return menuItem && menuItem.categoryId === category.id;
                    });
                }

                if (itemsInCategory.length > 0) {
                    categorizedOrderItems.push({ category, items: itemsInCategory });
                }
            });
            
            if (categorizedOrderItems.length > 0) {
                 receiptHTML += `<table class="w-full text-xs">
                    <thead>
                        <tr>
                            <th class="text-left">Item</th>
                            <th class="text-right">Qty</th>
                            <th class="text-right">Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead><tbody>`;

                categorizedOrderItems.forEach(({ category, items }) => {
                    receiptHTML += `<tr><td colspan="4" class="pt-1.5 pb-0.5 font-semibold text-primary" style="font-weight: bold; padding-top: 6px; padding-bottom: 2px;">${category.name}</td></tr>`;
                    items.forEach(item => {
                        let itemDisplayName = item.menuItemName;
                        receiptHTML += `<tr>
                            <td class="text-sm">${itemDisplayName}</td>
                            <td class="text-right text-sm">${item.quantity}</td>
                            <td class="text-right text-sm">₱${item.priceAtOrder.toFixed(2)}</td>
                            <td class="text-right text-sm">₱${(item.priceAtOrder * item.quantity).toFixed(2)}</td>
                        </tr>`;

                        if(item.selectedModifiers && item.selectedModifiers.length > 0) {
                            item.selectedModifiers.forEach(mod => {
                                receiptHTML += `<tr>
                                    <td class="text-xs pl-2 text-gray-600" style="padding-left: 8px; color: #555;">&nbsp;&nbsp;└ ${mod.optionName}</td>
                                    <td class="text-right text-xs"></td>
                                    <td class="text-right text-xs text-gray-600" style="color: #555;">${mod.priceChange !== 0 ? `(₱${mod.priceChange.toFixed(2)})` : ''}</td>
                                    <td class="text-right text-xs text-gray-600" style="color: #555;">${mod.priceChange !== 0 ? `₱${(mod.priceChange * item.quantity).toFixed(2)}` : ''}</td>
                                </tr>`;
                            });
                        }
                    });
                });
                 receiptHTML += `</tbody></table>`;
            } else {
                receiptHTML += `<p class="text-xs">No items to display on receipt.</p>`;
            }
           
            receiptHTML += `<hr class="my-1 border-dashed"/>
            <div class="text-right my-2">
                <p class="text-2xl font-bold">TOTAL: ₱${orderToPrint.totalAmount.toFixed(2)}</p>
            </div>
            <hr class="my-1 border-dashed"/>
            <p class="text-sm">Payment Method: ${orderToPrint.paymentMethod?.toUpperCase()}</p>`;
            if (orderToPrint.paymentMethod === 'cash' && orderToPrint.amountReceived !== undefined) {
                receiptHTML += `<p class="text-lg">Amount Received: ₱${orderToPrint.amountReceived.toFixed(2)}</p>`;
            }
            if (orderToPrint.paymentMethod === 'cash' && orderToPrint.changeGiven !== undefined) {
                 receiptHTML += `<p class="text-xl font-semibold">Change Given: ₱${orderToPrint.changeGiven.toFixed(2)}</p>`;
            }
            receiptHTML += `<p class="text-xs text-center mt-3">Thank you! Please come again.</p>
            <p class="text-xs text-center mt-0.5">Receipt not an official invoice for tax purposes unless stated.</p></div>`;
            
            // Create a temporary container to parse the HTML
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = receiptHTML;
            
            // Safely append the parsed content
            while (tempContainer.firstChild) {
              receiptWrapper.appendChild(tempContainer.firstChild);
            }
            
            receiptWrapper.classList.remove('hidden');
            
            // Print after a short delay to ensure content is rendered
            setTimeout(() => {
              window.print();
              // Hide the receipt after printing
              setTimeout(() => {
                receiptWrapper.classList.add('hidden');
                setOrderToPrint(null);
              }, 100);
            }, 100);
          } catch (error) {
            console.error('Error generating receipt:', error);
            setOrderToPrint(null);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderToPrint, cafeSettings, categories, getMenuItemById, getCategoryById]);

  const resetActiveOrderState = useCallback(() => {
    setCurrentOrderData(initialOrderDataState);
    setCurrentOrderItemsLocal([]);
    setModalPaymentMethod('cash');
    setModalAmountReceivedInput('');
    setConfiguringItem(null);
    setSelectedModifiersState({});
  }, [initialOrderDataState]);

  const handleResumeHeldOrder = useCallback((orderToResume: Order) => {
    setCurrentOrderData({ 
      ...orderToResume, 
      tableNumber: orderToResume.tableNumber || '',
      pax: orderToResume.pax || 1,
    });
    setCurrentOrderItemsLocal([...orderToResume.items]);
    setModalPaymentMethod(orderToResume.paymentMethod || 'cash');
    setModalAmountReceivedInput(orderToResume.paymentMethod === 'cash' && orderToResume.amountReceived ? String(orderToResume.amountReceived) : '');
    setIsHeldOrdersModalOpen(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddItemToOrder = (menuItem: MenuItem, chosenModifiers?: SelectedModifierOption[]) => {
    setCurrentOrderItemsLocal(prevItems => {
      const canStack = !menuItem.modifierGroups || menuItem.modifierGroups.length === 0;
      const existingItemIndex = canStack ? prevItems.findIndex(item => item.menuItemId === menuItem.id && (!item.selectedModifiers || item.selectedModifiers.length === 0)) : -1;

      if (existingItemIndex > -1 && canStack) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
        return updatedItems;
      }
      return [
        ...prevItems,
        { 
          id: uuidv4(), 
          menuItemId: menuItem.id, 
          menuItemName: menuItem.name,
          quantity: 1,
          priceAtOrder: menuItem.price,
          status: OrderItemStatus.PENDING,
          selectedModifiers: chosenModifiers || []
        }
      ];
    });
  };
  
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
     setCurrentOrderItemsLocal(prevItems => 
        prevItems.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
                  .filter(item => item.quantity > 0) 
     );
  };

  const calculateTotal = useMemo(() => {
    return currentOrderItemsLocal.reduce((total, currentItem) => {
        let itemBaseTotal = currentItem.priceAtOrder * currentItem.quantity;
        if (currentItem.selectedModifiers) {
            currentItem.selectedModifiers.forEach(mod => {
                itemBaseTotal += mod.priceChange * currentItem.quantity;
            });
        }
        return total + itemBaseTotal;
    },0);
  }, [currentOrderItemsLocal]);

  const modalChangeDue = useMemo(() => {
    if (modalPaymentMethod === 'cash' && modalAmountReceivedInput) {
      const received = parseFloat(modalAmountReceivedInput);
      if (!isNaN(received) && received >= calculateTotal) {
        return received - calculateTotal;
      }
    }
    return 0;
  }, [modalPaymentMethod, modalAmountReceivedInput, calculateTotal]);

  const openPaymentModal = () => {
    if (currentOrderItemsLocal.length === 0) {
        alert("Please add items to the order before proceeding to payment.");
        return;
    }
    setModalPaymentMethod(currentOrderData?.paymentMethod || 'cash'); 
    setModalAmountReceivedInput(
      (currentOrderData?.status === OrderStatus.ON_HOLD && currentOrderData?.paymentMethod === 'cash' && currentOrderData?.amountReceived)
      ? String(currentOrderData.amountReceived) 
      : ''
    );
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => setIsPaymentModalOpen(false);
  const openSuccessModal = (order: Order) => {
    setPlacedOrderForSuccessModal(order);
    setIsSuccessModalOpen(true);
    setTimeout(() => {
      closeSuccessModalAndReset();
    }, 3000);
  }
  const closeSuccessModalAndReset = () => {
    setIsSuccessModalOpen(false);
    setPlacedOrderForSuccessModal(null);
    resetActiveOrderState();
  }

  const handleAddDenominationToAmount = (denomination: number) => {
    setModalAmountReceivedInput(prev => String((parseFloat(prev) || 0) + denomination));
  };

  const handleFinalizePaymentAndPlaceOrder = async () => {
    if (isSubmittingOrder) return; // Prevent multiple submissions
    if (currentOrderItemsLocal.length === 0) return;
    if (modalPaymentMethod === 'cash' && (!modalAmountReceivedInput || parseFloat(modalAmountReceivedInput) < calculateTotal)) {
        alert("Amount received is less than total or not specified for cash payment.");
        return;
    }
    try {
        setIsSubmittingOrder(true); // Set loading state
        let finalPlacedOrder: Order | undefined;
        const orderPayloadItems = currentOrderItemsLocal.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            selectedModifiers: item.selectedModifiers
        }));

        if (currentOrderData?.id && currentOrderData.status === OrderStatus.ON_HOLD) { 
            await updateHeldOrder(currentOrderData.id, {
                items: currentOrderItemsLocal, 
                tableNumber: currentOrderData.tableNumber,
                pax: currentOrderData.pax,
            });
            await updateOrderStatus(currentOrderData.id, OrderStatus.PENDING, {
                paymentMethod: modalPaymentMethod,
                amountReceived: modalPaymentMethod === 'cash' ? parseFloat(modalAmountReceivedInput) : undefined,
                changeGiven: modalPaymentMethod === 'cash' ? modalChangeDue : undefined,
                isPaid: true,
            });
            finalPlacedOrder = getOrderById(currentOrderData.id);
        } else { 
            finalPlacedOrder = await addOrder({ 
              items: orderPayloadItems,
              tableNumber: currentOrderData?.tableNumber || '',
              pax: currentOrderData?.pax || undefined,
              status: OrderStatus.PENDING, 
              paymentMethod: modalPaymentMethod,
              amountReceived: modalPaymentMethod === 'cash' ? parseFloat(modalAmountReceivedInput) : undefined,
              isPaid: true,
            });
        }
        if (!finalPlacedOrder) throw new Error("Failed to finalize order details.");
        setOrderToPrint(finalPlacedOrder); 
        closePaymentModal();
        openSuccessModal(finalPlacedOrder);
    } catch (error) {
        alert(`Error placing order: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsSubmittingOrder(false); // Reset loading state
    }
  };

  const handleHoldOrder = () => {
    if (currentOrderItemsLocal.length === 0 && !currentOrderData?.id) return;
    try {
        if (currentOrderData?.id && currentOrderData.status === OrderStatus.ON_HOLD) { 
            updateHeldOrder(currentOrderData.id, {
                items: currentOrderItemsLocal,
                tableNumber: currentOrderData.tableNumber,
                pax: currentOrderData.pax,
                paymentMethod: currentOrderData.paymentMethod, 
                amountReceived: currentOrderData.amountReceived,
            });
            alert(`Held order updated.`);
        } else { 
            addOrder({
                items: currentOrderItemsLocal.map(item => ({
                    menuItemId: item.menuItemId, 
                    quantity: item.quantity,
                    selectedModifiers: item.selectedModifiers
                })),
                tableNumber: currentOrderData?.tableNumber || undefined,
                pax: currentOrderData?.pax || undefined,
                status: OrderStatus.ON_HOLD, 
                paymentMethod: currentOrderData?.paymentMethod,
                amountReceived: currentOrderData?.amountReceived,
                isPaid: false,
            });
            alert(`Order is now on hold.`);
        }
        resetActiveOrderState();
    } catch (error) {
        alert(`Error holding order: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleMenuItemClick = (menuItem: MenuItem) => {
    if (menuItem.modifierGroups && menuItem.modifierGroups.length > 0) {
        setConfiguringItem(menuItem);
        const initialSelections: Record<string, SelectedModifierOption[]> = {};
        menuItem.modifierGroups.forEach(group => {
            if (group.selectionType === 'single' && group.options.length > 0) {
                const firstOption = group.options[0];
                if (firstOption.priceChange === 0 || group.options.length === 1) {
                     initialSelections[group.id] = [{
                        groupId: group.id,
                        groupName: group.name,
                        optionId: firstOption.id,
                        optionName: firstOption.name,
                        priceChange: firstOption.priceChange
                    }];
                } else {
                    initialSelections[group.id] = [];
                }
            } else {
                 initialSelections[group.id] = [];
            }
        });
        setSelectedModifiersState(initialSelections);
        setIsModifierModalOpen(true);
    } else {
        handleAddItemToOrder(menuItem);
    }
  };

  const handleModifierSelectionChange = (groupId: string, option: MenuItemModifierOption, groupType: 'single' | 'multiple') => {
    setSelectedModifiersState(prev => {
        const newSelections = { ...prev };
        const currentGroupSelections = newSelections[groupId] ? [...newSelections[groupId]] : [];
        const selectedModOption: SelectedModifierOption = {
            groupId,
            groupName: configuringItem?.modifierGroups?.find(g => g.id === groupId)?.name || '',
            optionId: option.id,
            optionName: option.name,
            priceChange: option.priceChange
        };
        if (groupType === 'single') {
            newSelections[groupId] = [selectedModOption];
        } else { 
            const existingIndex = currentGroupSelections.findIndex(s => s.optionId === option.id);
            if (existingIndex > -1) {
                currentGroupSelections.splice(existingIndex, 1); 
            } else {
                currentGroupSelections.push(selectedModOption);
            }
            newSelections[groupId] = currentGroupSelections;
        }
        return newSelections;
    });
  };
  
  const calculateModifierModalTotal = () => {
    if (!configuringItem) return 0;
    let total = configuringItem.price;
    Object.values(selectedModifiersState).forEach(groupSelections => {
        groupSelections.forEach(mod => {
            total += mod.priceChange;
        });
    });
    return total;
  };

  const handleAddConfiguredItemToOrder = () => {
    if (!configuringItem) return;
    const finalSelectedModifiers: SelectedModifierOption[] = [];
    Object.values(selectedModifiersState).forEach(groupSelections => {
        finalSelectedModifiers.push(...groupSelections);
    });
    handleAddItemToOrder(configuringItem, finalSelectedModifiers);
    setIsModifierModalOpen(false);
    setConfiguringItem(null);
    setSelectedModifiersState({});
  };

  const itemsInSelectedCategory = menuItems.filter(item => item.isAvailable && (selectedCategory === 'all' || item.categoryId === selectedCategory));
  const heldOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.ON_HOLD).sort((a,b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime()), [orders]);
  const recentPaidOrders = useMemo(() => orders.filter(o => o.isPaid && o.status !== OrderStatus.ON_HOLD).sort((a,b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime()).slice(0, 5), [orders]);

  // Memoize grouped items for recent order detail modal
  const groupedRecentOrderItems = useMemo(() => {
    if (!selectedRecentOrderForDetail) return [];

    const itemMap = new Map<string, { categoryName: string; items: OrderItemType[] }>();
    const allCats = [...categories, { id: 'uncategorized', name: 'Uncategorized', description: '' } as Category];

    allCats.forEach(cat => {
        const itemsInThisCategory = selectedRecentOrderForDetail.items.filter(orderItem => {
            const menuItem = getMenuItemById(orderItem.menuItemId);
            if (cat.id === 'uncategorized') {
                if (!menuItem) return true;
                return !categories.some(c => c.id === menuItem.categoryId);
            }
            return menuItem && menuItem.categoryId === cat.id;
        });
        if (itemsInThisCategory.length > 0) {
            itemMap.set(cat.id, { categoryName: cat.name, items: itemsInThisCategory });
        }
    });
    return Array.from(itemMap.values());
  }, [selectedRecentOrderForDetail, categories, getMenuItemById]);


  return (
    <div className="flex flex-col lg:flex-row h-full max-h-full overflow-hidden">
      <div className="lg:w-2/3 p-4 flex flex-col overflow-hidden h-full">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-primary">Point of Sale</h1>
            <button onClick={() => setIsHeldOrdersModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md flex items-center transition-colors text-sm">
                <ArchiveBoxIcon className="w-5 h-5 mr-1.5" /> View Held
                {heldOrders.length > 0 && (<span className="ml-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{heldOrders.length}</span>)}
            </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 flex-shrink-0">
            <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-surface text-textPrimary border border-gray-300 hover:bg-gray-100'}`}>All Categories</button>
            {categories.map((cat: Category) => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-surface text-textPrimary border border-gray-300 hover:bg-gray-100'}`}>{cat.name}</button>))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 flex-grow overflow-y-auto custom-scrollbar pb-4">
            {itemsInSelectedCategory.map(item => (
                <button key={item.id} onClick={() => handleMenuItemClick(item)} className="bg-surface hover:bg-accent/60 rounded-lg shadow text-left transition-all focus:ring-2 focus:ring-primary flex flex-col border border-gray-200 overflow-hidden max-h-60 h-60">
                    <img src={item.imageUrl || DEFAULT_MENU_IMAGE} alt={item.name} className="w-full h-28 md:h-32 object-cover" />
                    <div className="p-3 flex flex-col flex-grow">
                        <p className="font-semibold text-primary text-base leading-tight flex-grow">{item.name}</p>
                        <p className="text-sm text-textSecondary mt-1">₱{item.price.toFixed(2)}</p>
                    </div>
                </button>
            ))}
            {itemsInSelectedCategory.length === 0 && <p className="text-sm text-gray-500 col-span-full text-center py-10">No items in this category.</p>}
        </div>
      </div>

      <div className="lg:w-1/3 bg-gray-50 p-4 flex flex-col border-l border-gray-200 h-full max-h-full overflow-hidden">
        <div className="flex-shrink-0">
            <h3 className="text-xl font-semibold text-textPrimary mb-3">Current Order</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label htmlFor="tableNumber" className="block text-xs font-medium text-textPrimary mb-0.5 flex items-center"><TableCellsIcon className="w-3 h-3 mr-1"/>Table</label>
                    <input type="text" id="tableNumber" value={currentOrderData.tableNumber} onChange={(e) => setCurrentOrderData(prev => ({...prev, tableNumber: e.target.value}))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm" placeholder="e.g., T5, Bar" />
                </div>
                <div>
                    <label htmlFor="pax" className="block text-xs font-medium text-textPrimary mb-0.5 flex items-center"><PaxIcon className="w-3 h-3 mr-1"/>Pax</label>
                    <input type="number" id="pax" value={currentOrderData.pax} onChange={(e) => setCurrentOrderData(prev => ({...prev, pax: parseInt(e.target.value) || 1 }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm" min="1"/>
                </div>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar mb-3 pr-1"> 
            {currentOrderItemsLocal.length === 0 ? (<p className="text-sm text-gray-500 py-4 text-center h-full flex items-center justify-center">No items added yet.</p>) : (
                <div className="space-y-2">
                    {currentOrderItemsLocal.map(orderItem => (
                        <div key={orderItem.id} className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-textPrimary text-base leading-tight">{orderItem.menuItemName}</p>
                                    <p className="text-sm text-textSecondary">Base Price: ₱{orderItem.priceAtOrder.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center">
                                    <input type="number" value={orderItem.quantity} onChange={(e) => handleQuantityChange(orderItem.id, parseInt(e.target.value))} className="w-16 text-center border-gray-300 rounded-md p-1.5 mr-2 text-lg font-medium" min="0" />
                                    <button onClick={() => handleQuantityChange(orderItem.id, 0)} className="text-red-500 hover:text-red-700 text-2xl p-1" title="Remove item">&times;</button>
                                </div>
                            </div>
                            {orderItem.selectedModifiers && orderItem.selectedModifiers.length > 0 && (
                                <div className="mt-1.5 pl-2 border-l-2 border-primary/30">
                                    {orderItem.selectedModifiers.map(mod => (
                                        <p key={mod.optionId} className="text-xs text-gray-600">
                                            + {mod.optionName} {mod.priceChange !== 0 ? `(₱${mod.priceChange.toFixed(2)})` : ''}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="flex-shrink-0 pt-2 border-t border-gray-200">
            <h4 className="text-md font-semibold text-textPrimary mb-2">Recent Transactions</h4>
            {recentPaidOrders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No recent transactions.</p>
            ) : (
                <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                    {recentPaidOrders.map(order => (
                        <div key={order.id} className="bg-gray-100 p-2 rounded-md text-xs flex justify-between items-center">
                            <div>
                                <p className="font-medium text-textSecondary">Token: {order.tokenNumber}</p>
                                <p className="text-gray-500">Total: ₱{order.totalAmount.toFixed(2)} ({order.status})</p>
                            </div>
                            <button 
                                onClick={() => { setSelectedRecentOrderForDetail(order); setIsRecentOrderDetailModalOpen(true); }}
                                className="text-primary hover:underline text-xs font-medium"
                            >
                                Details
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="pt-3 border-t border-gray-200 mt-auto flex-shrink-0">
            <p className="text-2xl font-bold text-textPrimary mb-1 text-right">Total: ₱{calculateTotal.toFixed(2)}</p>
            <p className="text-md font-semibold text-textPrimary mb-3 text-right">Items: {calculateTotalItemQuantity(currentOrderItemsLocal)}</p>
            <button type="button" onClick={openPaymentModal} className="w-full px-4 py-3 bg-primary hover:bg-opacity-90 text-white font-bold rounded-lg shadow-md mb-2 text-lg" disabled={currentOrderItemsLocal.length === 0}>Proceed to Payment</button>
            <div className="mt-1 flex space-x-2">
                <button type="button" onClick={handleHoldOrder} className="flex-1 px-3 py-1.5 border border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-medium rounded-lg text-sm flex items-center justify-center" disabled={currentOrderItemsLocal.length === 0 && !currentOrderData?.id}><PauseCircleIcon className="w-4 h-4 mr-1.5"/> {currentOrderData?.status === OrderStatus.ON_HOLD ? 'Update Held' : 'Hold Order'}</button>
                <button type="button" onClick={resetActiveOrderState} className="flex-1 px-3 py-1.5 border border-gray-400 text-textPrimary hover:bg-gray-100 font-medium rounded-lg text-sm flex items-center justify-center"><ClearIcon className="w-4 h-4 mr-1.5" /> Clear Order</button>
            </div>
        </div>
      </div>
      
      {isPaymentModalOpen && (<Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} title="Finalize Payment" size="md">
        <div className="space-y-6">
            <div className="text-center"><p className="text-textSecondary text-lg">Total Amount Due:</p><p className="text-primary font-bold text-4xl my-2">₱{calculateTotal.toFixed(2)}</p></div>
            <div className="space-y-3 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium text-textPrimary mb-2">Select Payment Method:</p>
                <div className="flex justify-around">
                    {(['cash', 'card', 'gcash'] as PaymentMethod[]).map(method => (<button key={method} type="button" onClick={() => setModalPaymentMethod(method)} className={`px-4 py-2 rounded-lg text-base font-semibold flex items-center justify-center w-1/3 mx-1.5 transition-all ${modalPaymentMethod === method ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white text-textPrimary border border-gray-300 hover:bg-gray-50'}`}>{method === 'cash' && <CurrencyDollarIcon className="w-5 h-5 mr-2" />}{method === 'card' && <CreditCardIcon className="w-5 h-5 mr-2" />}{method === 'gcash' && <CurrencyDollarIcon className="w-5 h-5 mr-2" />} {method.charAt(0).toUpperCase() + method.slice(1)}</button>))}
                </div>
                {modalPaymentMethod === 'cash' && (<div className="mt-4 space-y-3"><div><label htmlFor="modalAmountReceived" className="block text-sm font-medium text-textPrimary mb-1">Amount Received</label><div className="flex items-center space-x-2"><input type="number" id="modalAmountReceived" value={modalAmountReceivedInput} onChange={(e) => setModalAmountReceivedInput(e.target.value)} className="flex-grow px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-lg" placeholder="0.00" min={calculateTotal > 0 ? calculateTotal.toString() : "0"} autoFocus /><button type="button" onClick={() => setModalAmountReceivedInput('')} className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs text-textPrimary hover:bg-gray-200">Clear</button></div></div><div className="grid grid-cols-4 gap-2 mt-2">{philippineDenominations.map(denom => (<button key={denom} type="button" onClick={() => handleAddDenominationToAmount(denom)} className="bg-secondary hover:bg-opacity-80 text-white font-medium py-2 rounded-md text-sm">₱{denom}</button>))}</div><p className="text-textPrimary text-xl">Change Due: <span className="font-bold text-green-600">₱{(modalChangeDue || 0).toFixed(2)}</span></p></div>)}
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-4"><button type="button" onClick={closePaymentModal} className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-textPrimary hover:bg-gray-100 transition-colors text-base">Cancel</button><button
              onClick={handleFinalizePaymentAndPlaceOrder}
              disabled={isSubmittingOrder || modalPaymentMethod === 'cash' && (!modalAmountReceivedInput || parseFloat(modalAmountReceivedInput) < calculateTotal)}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingOrder ? (
                <>
                  <LoadingSpinner className="w-5 h-5 mr-2 inline" />
                  Processing Order...
                </>
              ) : (
                'Confirm Payment & Place Order'
              )}
            </button></div>
        </div>
      </Modal>)}

      {isHeldOrdersModalOpen && (<Modal isOpen={isHeldOrdersModalOpen} onClose={() => setIsHeldOrdersModalOpen(false)} title={`Held Orders (${heldOrders.length})`} size="lg">
        {heldOrders.length === 0 ? (<p className="text-textSecondary text-center py-4">No orders are currently on hold.</p>) : (<div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">{heldOrders.map(order => (<div key={order.id} className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"><div><p className="font-semibold text-yellow-700">{order.tableNumber ? `Table: ${order.tableNumber}` : `Token: ${order.tokenNumber || 'N/A'}`}{order.pax && ` (${order.pax}p)`}</p><p className="text-xs text-yellow-600">{calculateTotalItemQuantity(order.items)} item(s) - Total: ₱{order.totalAmount.toFixed(2)}</p><p className="text-xs text-gray-500 mt-0.5">Held at: {new Date(order.orderTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div><button onClick={() => handleResumeHeldOrder(order)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors shadow whitespace-nowrap mt-2 sm:mt-0">Resume</button></div>))}</div>)}
      </Modal>)}

      {configuringItem && isModifierModalOpen && (
        <Modal isOpen={isModifierModalOpen} onClose={() => setIsModifierModalOpen(false)} title={`Configure: ${configuringItem.name}`} size="lg">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <img src={configuringItem.imageUrl || DEFAULT_MENU_IMAGE} alt={configuringItem.name} className="w-32 h-32 object-cover rounded-lg mx-auto shadow-md mb-2" />
              <p className="text-lg font-semibold text-primary">{configuringItem.name}</p>
              <p className="text-sm text-textSecondary">Base Price: ₱{configuringItem.price.toFixed(2)}</p>
            </div>

            {configuringItem.modifierGroups?.map(group => (
              <div key={group.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="text-md font-semibold text-textPrimary mb-2">{group.name} <span className="text-xs text-gray-500">({group.selectionType === 'single' ? 'Choose one' : 'Choose any'})</span></h4>
                <div className={`space-y-2 ${group.selectionType === 'multiple' ? 'grid grid-cols-2 gap-x-4 gap-y-2' : ''}`}>
                  {group.options.map(option => (
                    <label key={option.id} className={`flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors text-sm
                                                    ${selectedModifiersState[group.id]?.some(s => s.optionId === option.id) ? 'bg-accent/30 border border-primary/50' : 'border border-transparent'}`}>
                      {group.selectionType === 'multiple' ? (
                        <input type="checkbox" checked={selectedModifiersState[group.id]?.some(s => s.optionId === option.id)} onChange={() => handleModifierSelectionChange(group.id, option, group.selectionType)} className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary mr-2" />
                      ) : (
                        <input type="radio" name={`modifier_group_${group.id}`} checked={selectedModifiersState[group.id]?.some(s => s.optionId === option.id)} onChange={() => handleModifierSelectionChange(group.id, option, group.selectionType)} className="form-radio h-4 w-4 text-primary border-gray-300 focus:ring-primary mr-2" />
                      )}
                      <span className="flex-grow text-textSecondary">{option.name}</span>
                      <span className="text-xs text-primary/80 ml-2">{option.priceChange !== 0 ? `(₱${option.priceChange.toFixed(2)})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6 pt-4 border-t border-gray-200 text-right">
              <p className="text-xl font-bold text-primary">Item Total: ₱{calculateModifierModalTotal().toFixed(2)}</p>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setIsModifierModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-textPrimary hover:bg-gray-100">Cancel</button>
              <button type="button" onClick={handleAddConfiguredItemToOrder} className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg">Add to Order</button>
            </div>
          </div>
        </Modal>
      )}

       {isSuccessModalOpen && placedOrderForSuccessModal && (
            <Modal isOpen={isSuccessModalOpen} onClose={closeSuccessModalAndReset} title="Success!" size="sm">
                <div className="text-center space-y-4">
                    <BellIcon className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
                    <p className="text-xl font-semibold text-textPrimary">
                        Order <span className="text-primary">#{placedOrderForSuccessModal.tokenNumber}</span> Placed Successfully!
                    </p>
                    <p className="text-lg text-textSecondary">
                        Total Amount: ₱{placedOrderForSuccessModal.totalAmount.toFixed(2)}
                    </p>
                     <p className="text-lg font-semibold text-textPrimary">
                        Total Items: {calculateTotalItemQuantity(placedOrderForSuccessModal.items)}
                    </p>
                    <button 
                        onClick={closeSuccessModalAndReset}
                        className="w-full bg-primary hover:bg-opacity-90 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                    >
                        New Order
                    </button>
                </div>
            </Modal>
        )}

        {selectedRecentOrderForDetail && (
            <Modal isOpen={isRecentOrderDetailModalOpen} onClose={() => { setIsRecentOrderDetailModalOpen(false); setSelectedRecentOrderForDetail(null); }} title={`Order Details: #${selectedRecentOrderForDetail.tokenNumber}`} size="lg">
                 <div className="space-y-3 text-sm">
                    <p><strong>Order #:</strong> {selectedRecentOrderForDetail.orderNumber}</p>
                    <p><strong>Time:</strong> {new Date(selectedRecentOrderForDetail.orderTime).toLocaleString()}</p>
                    <p><strong>Status:</strong> {selectedRecentOrderForDetail.status.replace(/_/g, ' ')}</p>
                    <p><strong>Table:</strong> {selectedRecentOrderForDetail.tableNumber || 'N/A'}</p>
                    <p><strong>Pax:</strong> {selectedRecentOrderForDetail.pax || 'N/A'}</p>
                    <hr/>
                    <p><strong>Payment Method:</strong> {selectedRecentOrderForDetail.paymentMethod?.toUpperCase() || 'N/A'}</p>
                    <p><strong>Total Amount:</strong> ₱{selectedRecentOrderForDetail.totalAmount.toFixed(2)}</p>
                    <p><strong>Total Items:</strong> <span className="font-bold text-lg">{calculateTotalItemQuantity(selectedRecentOrderForDetail.items)}</span></p>
                    {selectedRecentOrderForDetail.paymentMethod === 'cash' && (
                        <>
                            <p><strong>Amount Received:</strong> ₱{selectedRecentOrderForDetail.amountReceived?.toFixed(2)}</p>
                            <p><strong>Change Given:</strong> ₱{selectedRecentOrderForDetail.changeGiven?.toFixed(2)}</p>
                        </>
                    )}
                    <hr/>
                    <h5 className="font-semibold mt-2">Items:</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {groupedRecentOrderItems.map(({ categoryName, items }) => (
                        <div key={categoryName}>
                          <h6 className="font-medium text-gray-700 mt-1.5">{categoryName}</h6>
                          <ul className="list-disc list-inside pl-5 space-y-0.5">
                            {items.map(item => (
                                <li key={item.id} className="text-xs">
                                    {item.menuItemName} (x{item.quantity}) - @ ₱{item.priceAtOrder.toFixed(2)} each
                                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                        <ul className="pl-4 text-gray-600 text-[0.7rem] leading-tight">
                                            {item.selectedModifiers.map(mod => (
                                                <li key={mod.optionId}>└ {mod.optionName} {mod.priceChange !== 0 ? `(₱${mod.priceChange.toFixed(2)})` : ''}</li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                     <div className="mt-4 flex justify-end">
                        <button onClick={() => { setIsRecentOrderDetailModalOpen(false); setSelectedRecentOrderForDetail(null);}} className="px-4 py-2 border rounded-md">Close</button>
                    </div>
                </div>
            </Modal>
        )}

      <div id="receipt-content-wrapper" className="hidden print:block print:absolute print:left-0 print:top-0 print:w-full"></div>
    </div>
  );
};

export default POSPage;
