import React, { useState, useMemo, useEffect } from 'react';
import { useOrder } from '../../contexts/OrderContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useUser } from '../../contexts/UserContext';
import { useMenu } from '../../contexts/MenuContext'; // Import useMenu
import { Order, OrderStatus, OrderItemStatus, OrderItem as OrderItemType, UserRole, CafeSettings, Category } from '../../types'; 
import Modal from '../../components/Modal';
import { OrderHistoryIcon, TableCellsIcon, UsersIcon, CheckCircleIcon, ClockIcon, CogIcon, MinusCircleIcon, CurrencyDollarIcon, CreditCardIcon, PauseCircleIcon, BellAlertIcon, PrinterIcon } from '../../components/icons/Icons';
import { format } from 'date-fns';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { OrderItemStatusBadge } from '../../components/OrderItemStatusBadge';

const calculateTotalItemQuantity = (items: OrderItemType[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

const getOrderStatusIcon = (status: OrderStatus | OrderItemStatus) => {
  const iconClass = "w-4 h-4 mr-1.5";
  switch (status) {
    case OrderStatus.PENDING:
    case OrderItemStatus.PENDING:
      return <ClockIcon className={`${iconClass} text-gray-500`} />;
    case OrderStatus.PREPARING:
    case OrderItemStatus.PREPARING:
      return <CogIcon className={`${iconClass} text-yellow-500`} />;
    case OrderStatus.PARTIALLY_READY:
      return <CogIcon className={`${iconClass} text-blue-500`} />;
    case OrderStatus.READY_FOR_DELIVERY:
    case OrderItemStatus.AWAITING_DELIVERY: 
    case OrderItemStatus.READY: 
      return <BellAlertIcon className={`${iconClass} text-blue-600`} />; 
    case OrderStatus.DELIVERY_IN_PROGRESS:
        return <CogIcon className={`${iconClass} text-purple-500`} />;
    case OrderStatus.COMPLETED:
    case OrderItemStatus.DELIVERED_TO_CUSTOMER:
      return <CheckCircleIcon className={`${iconClass} text-green-700`} />;
    case OrderStatus.CANCELLED:
    case OrderItemStatus.CANCELLED:
      return <MinusCircleIcon className={`${iconClass} text-red-500`} />;
    case OrderStatus.ON_HOLD:
      return <PauseCircleIcon className={`${iconClass} text-orange-500`} />;
    default:
      return <ClockIcon className={`${iconClass} text-gray-500`} />; 
  }
};

const getPaymentMethodIcon = (method?: 'cash' | 'card' | 'gcash') => {
  const iconClass = "w-4 h-4 mr-1.5";
  switch (method) {
    case 'cash':
      return <CurrencyDollarIcon className={`${iconClass} text-green-600`} />;
    case 'card':
      return <CreditCardIcon className={`${iconClass} text-blue-600`} />;
    case 'gcash':
      return <CurrencyDollarIcon className={`${iconClass} text-sky-600`} />;
    default:
      return null;
  }
};

const displayOrderStatusText = (status: OrderStatus): string => {
  if (status === OrderStatus.READY_FOR_DELIVERY) return "READY TO SERVE";
  return status.replace(/_/g, ' ').toUpperCase();
};

const displayOrderItemStatusText = (status: OrderItemStatus): string => {
  if (status === OrderItemStatus.AWAITING_DELIVERY || status === OrderItemStatus.READY) return "READY TO SERVE";
  if (status === OrderItemStatus.DELIVERED_TO_CUSTOMER) return "SERVED";
  return status.replace(/_/g, ' ').toUpperCase();
};


const OrderHistoryPage: React.FC = () => {
  const { orders, updateOrderStatus } = useOrder();
  const { settings: cafeSettings } = useSettings();
  const { currentUser } = useUser();
  const { categories, getMenuItemById, getCategoryById } = useMenu(); // Get categories from MenuContext

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'last7days'>('all');
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  const formatDateTime = (date: Date | string) => new Date(date).toLocaleString();
  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString();

  const generateReceiptHTML = (order: Order, currentCafeSettings: CafeSettings): string => {
    const totalItemsQuantity = calculateTotalItemQuantity(order.items);
    let receiptHTML = `<div class="text-center mb-2">
        <h2 class="text-lg font-bold">${currentCafeSettings.companyName}</h2>
        <p class="text-xs">${currentCafeSettings.address}</p>
        <p class="text-xs">${currentCafeSettings.phone}</p>
        <p class="text-xs">TIN: ${currentCafeSettings.tin}</p>
    </div>
    <hr class="my-1 border-dashed"/>
    <p class="text-xs">Date: ${new Date(order.orderTime).toLocaleString()}</p>
    <p class="text-xs">Order #: ${order.orderNumber} | Token: <span class="font-bold text-base">${order.tokenNumber}</span></p>
    <p class="total-items-receipt">Total Items: ${totalItemsQuantity}</p>
    ${order.tableNumber ? `<p class="text-xs">Table: ${order.tableNumber}</p>` : ''}
    ${order.pax ? `<p class="text-xs">Pax: ${order.pax}</p>` : ''}
    <hr class="my-1 border-dashed"/>`;

    // Group items by category for receipt
    const categorizedOrderItems: { category: Category; items: OrderItemType[] }[] = [];
    const allAvailableCategories = [...categories, {id: 'uncategorized', name: 'Uncategorized', description: 'Items without a defined category'} as Category];

    allAvailableCategories.forEach(category => {
        let itemsInCategory: OrderItemType[];
        if (category.id === 'uncategorized') {
            itemsInCategory = order.items.filter(orderItem => {
                const menuItem = getMenuItemById(orderItem.menuItemId);
                if (!menuItem) return true; 
                return !categories.some(c => c.id === menuItem.categoryId);
            });
        } else {
            itemsInCategory = order.items.filter(orderItem => {
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
        <p class="text-2xl font-bold">TOTAL: ₱${order.totalAmount.toFixed(2)}</p>
    </div>
    <hr class="my-1 border-dashed"/>
    <p class="text-sm">Payment Method: ${order.paymentMethod?.toUpperCase()}</p>`;
    if (order.paymentMethod === 'cash' && order.amountReceived !== undefined) {
        receiptHTML += `<p class="text-lg">Amount Received: ₱${order.amountReceived.toFixed(2)}</p>`;
    }
    if (order.paymentMethod === 'cash' && order.changeGiven !== undefined) {
         receiptHTML += `<p class="text-xl font-semibold">Change Given: ₱${order.changeGiven.toFixed(2)}</p>`;
    }
    receiptHTML += `<p class="text-xs text-center mt-3">Thank you! Please come again.</p>
    <p class="text-xs text-center mt-0.5">Receipt not an official invoice for tax purposes unless stated.</p></div>`;
    return receiptHTML;
  };

  useEffect(() => {
    if (orderToPrint) {
      const timer = setTimeout(() => {
        const receiptWrapper = document.getElementById('receipt-content-wrapper');
        if (receiptWrapper) {
            receiptWrapper.innerHTML = generateReceiptHTML(orderToPrint, cafeSettings);
            receiptWrapper.classList.remove('hidden'); 
        }
        window.print();
        if (receiptWrapper) receiptWrapper.classList.add('hidden'); 
        setOrderToPrint(null); 
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderToPrint, cafeSettings, categories, getMenuItemById, getCategoryById]); // Added dependencies

  const handlePrintReceipt = (order: Order) => {
    setOrderToPrint(order);
  };

  const filteredOrders = useMemo(() => {
    let tempOrders = [...orders];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);

    if (dateFilter === 'today') tempOrders = tempOrders.filter(o => formatDate(o.orderTime) === todayStr);
    else if (dateFilter === 'yesterday') tempOrders = tempOrders.filter(o => formatDate(o.orderTime) === yesterdayStr);
    else if (dateFilter === 'last7days') tempOrders = tempOrders.filter(o => {
        const orderDate = new Date(o.orderTime);
        if (isNaN(orderDate.getTime())) return false; 
        const sevenDaysAgoStart = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
        return orderDate >= sevenDaysAgoStart && orderDate <= today;
    });

    if (statusFilter !== 'all') tempOrders = tempOrders.filter(o => o.status === statusFilter);
    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(o =>
        o.orderNumber.toLowerCase().includes(lowerSearchTerm) ||
        o.tokenNumber.toLowerCase().includes(lowerSearchTerm) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return tempOrders.sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };
  
  const handleCancelOrder = (orderId: string) => {
    if (!selectedOrder) return;
    if (window.confirm(`Are you sure you want to cancel order #${selectedOrder.tokenNumber}? This action cannot be undone.`)) {
        updateOrderStatus(orderId, OrderStatus.CANCELLED);
        handleCloseModal(); // Close modal after action
    }
  };

  const canCancelOrder = currentUser?.role === UserRole.SUPER_ADMIN || 
                         currentUser?.role === UserRole.BRANCH_ADMIN || 
                         currentUser?.role === UserRole.CASHIER;


  const orderStatusOptions = Object.values(OrderStatus);

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
        case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
        case OrderStatus.PENDING: return 'bg-gray-100 text-gray-800';
        case OrderStatus.PREPARING: return 'bg-yellow-100 text-yellow-800';
        case OrderStatus.READY_FOR_DELIVERY: return 'bg-blue-100 text-blue-800'; 
        case OrderStatus.PARTIALLY_READY: return 'bg-indigo-100 text-indigo-800';
        case OrderStatus.DELIVERY_IN_PROGRESS: return 'bg-purple-100 text-purple-800';
        case OrderStatus.ON_HOLD: return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getItemStatusBadgeStyle = (status: OrderItemStatus) => {
    switch (status) {
        case OrderItemStatus.DELIVERED_TO_CUSTOMER: return 'bg-green-100 text-green-800';
        case OrderItemStatus.CANCELLED: return 'bg-red-100 text-red-800';
        case OrderItemStatus.PENDING: return 'bg-gray-100 text-gray-800';
        case OrderItemStatus.PREPARING: return 'bg-yellow-100 text-yellow-800';
        case OrderItemStatus.AWAITING_DELIVERY:
        case OrderItemStatus.READY: 
            return 'bg-blue-100 text-blue-800'; 
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Memoize grouped items for selectedOrder modal
  const groupedModalOrderItems = useMemo(() => {
    if (!selectedOrder) return [];

    const itemMap = new Map<string, { categoryName: string; items: OrderItemType[] }>();
    const allCats = [...categories, { id: 'uncategorized', name: 'Uncategorized', description: '' } as Category];

    allCats.forEach(cat => {
        const itemsInThisCategory = selectedOrder.items.filter(orderItem => {
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
  }, [selectedOrder, categories, getMenuItemById]);


  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300 gap-4">
        <h1 className="text-4xl font-bold text-primary flex items-center"><OrderHistoryIcon className="w-10 h-10 mr-3 text-primary" /> Order History</h1>
      </div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg shadow">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-textSecondary mb-1">Search</label>
          <input type="text" id="searchTerm" placeholder="Order #, Token #, Table #" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-textSecondary mb-1">Status</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white">
            <option value="all">All Statuses</option>
            {orderStatusOptions.map(status => (<option key={status} value={status}>{displayOrderStatusText(status)}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="dateFilter" className="block text-sm font-medium text-textSecondary mb-1">Date</label>
          <select id="dateFilter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'yesterday' | 'last7days')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white">
            <option value="all">All Time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last7days">Last 7 Days</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-10 bg-surface rounded-lg shadow">
          <OrderHistoryIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">No Orders Found</h2>
          <p className="text-textSecondary">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="bg-surface p-0 sm:p-6 rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Table</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">Total (₱)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textPrimary font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textPrimary">{order.tokenNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{formatDateTime(order.orderTime)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{order.tableNumber || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textPrimary text-right font-semibold">{order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">
                     <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusBadgeStyle(order.status)}`}>
                        {getOrderStatusIcon(order.status)}
                        {displayOrderStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{order.isPaid ? (<span className="flex items-center text-green-700">{getPaymentMethodIcon(order.paymentMethod)}{order.paymentMethod?.toUpperCase() || 'PAID'}</span>) : <span className="text-red-600">UNPAID</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleViewDetails(order)} className="text-primary hover:underline text-xs">Details</button>
                    {order.isPaid && (
                         <button onClick={() => handlePrintReceipt(order)} className="text-blue-600 hover:underline text-xs flex items-center justify-end" title="Print Receipt">
                            <PrinterIcon className="w-4 h-4 mr-1" /> Print
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Order Details: #${selectedOrder.orderNumber}`} size="xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-md"><p className="font-semibold text-textPrimary">Order Info</p><p><strong>Token:</strong> {selectedOrder.tokenNumber}</p><p><strong>Time:</strong> {formatDateTime(selectedOrder.orderTime)}</p><p><strong>Status:</strong> <span className="font-medium">{displayOrderStatusText(selectedOrder.status)}</span></p></div>
              <div className="bg-gray-50 p-3 rounded-md"><p className="font-semibold text-textPrimary">Customer Info</p><p><strong>Table:</strong> {selectedOrder.tableNumber || 'N/A'}</p><p><strong>Pax:</strong> {selectedOrder.pax || 'N/A'}</p></div>
              <div className="bg-gray-50 p-3 rounded-md"><p className="font-semibold text-textPrimary">Payment Info</p><p><strong>Total:</strong> ₱{selectedOrder.totalAmount.toFixed(2)}</p><p><strong>Paid:</strong> {selectedOrder.isPaid ? 'Yes' : 'No'}</p><p><strong>Total Items:</strong> <span className="font-bold text-lg">{calculateTotalItemQuantity(selectedOrder.items)}</span></p>{selectedOrder.isPaid && selectedOrder.paymentMethod && (<><p><strong>Method:</strong> {selectedOrder.paymentMethod.toUpperCase()}</p>{selectedOrder.paymentMethod === 'cash' && selectedOrder.amountReceived !== undefined && (<p><strong>Received:</strong> ₱{selectedOrder.amountReceived.toFixed(2)}</p>)}{selectedOrder.paymentMethod === 'cash' && selectedOrder.changeGiven !== undefined && (<p><strong>Change:</strong> ₱{selectedOrder.changeGiven.toFixed(2)}</p>)}</>)}</div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-textPrimary mb-2">Order Items ({calculateTotalItemQuantity(selectedOrder.items)})</h4>
              <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-md custom-scrollbar">
                {groupedModalOrderItems.map(({ categoryName, items }) => (
                    <div key={categoryName} className="mb-3">
                        <h5 className="text-md font-semibold text-primary bg-gray-100 p-2 sticky top-0 z-10">{categoryName}</h5>
                        <table className="min-w-full">
                            <thead className="sr-only"><tr><th>Item</th><th>Details</th></tr></thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {items.map((item: OrderItemType) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 align-top">
                                            <p className="text-sm text-textPrimary font-medium">{item.menuItemName}</p>
                                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                                <div className="pl-2 mt-0.5">
                                                    {item.selectedModifiers.map(mod => (
                                                        <p key={mod.optionId} className="text-xs text-gray-500 leading-tight">
                                                            &nbsp;&nbsp;└ <span className="italic">{mod.groupName}:</span> {mod.optionName} {mod.priceChange !== 0 ? `(₱${mod.priceChange.toFixed(2)})` : ''}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right align-top">
                                            <p>{item.quantity} x ₱{item.priceAtOrder.toFixed(2)}</p>
                                            <p className="font-medium">Subtotal: ₱{(item.priceAtOrder * item.quantity + (item.selectedModifiers?.reduce((acc, cur) => acc + cur.priceChange, 0) || 0) * item.quantity).toFixed(2)}</p>
                                            <span className={`mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getItemStatusBadgeStyle(item.status)}`}>
                                                {getOrderStatusIcon(item.status)}
                                                {displayOrderItemStatusText(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
                {groupedModalOrderItems.length === 0 && <p className="p-4 text-center text-gray-500">No items in this order.</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
                <div>
                    {canCancelOrder && selectedOrder.status !== OrderStatus.COMPLETED && selectedOrder.status !== OrderStatus.CANCELLED && (
                        <button 
                            onClick={() => handleCancelOrder(selectedOrder.id)} 
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md flex items-center"
                        >
                           <MinusCircleIcon className="w-5 h-5 mr-2"/> Cancel Order
                        </button>
                    )}
                </div>
                <div className="space-x-3">
                    {selectedOrder.isPaid && (
                         <button 
                            onClick={() => handlePrintReceipt(selectedOrder)} 
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md flex items-center"
                        >
                            <PrinterIcon className="w-5 h-5 mr-2"/> Print Receipt
                        </button>
                    )}
                    <button onClick={handleCloseModal} className="px-6 py-2 border border-gray-300 rounded-lg text-textPrimary hover:bg-gray-100 transition-colors">Close</button>
                </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderHistoryPage;
