
import React, { useMemo, useState, useEffect } from 'react'; // Added useState, useEffect
import { useOrder } from '../../contexts/OrderContext';
import { useMenu } from '../../contexts/MenuContext';
import { Order, OrderItem, OrderStatus, OrderItemStatus } from '../../types';
import { CocktailIcon, CheckCircleIcon, TableCellsIcon, ClockIcon, PrinterIcon } from '../../components/icons/Icons';

const calculateTotalItemQuantity = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

const BarDisplayPage: React.FC = () => {
  const { orders, markOrderItemDeliveredByBar } = useOrder();
  const { getMenuItemById } = useMenu(); 
  const [orderSlipToPrint, setOrderSlipToPrint] = useState<Order | null>(null);
  
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const generateBarSlipHTML = (order: Order, itemsToDisplay: OrderItem[]): string => {
    let slipHTML = `<div style="font-family: 'Arial', sans-serif; width: 300px; padding: 10px; border: 1px solid #333;">
        <h2 style="text-align: center; font-size: 1.2em; margin: 0 0 5px 0;">Bar Slip</h2>
        <p style="font-size: 0.9em; margin: 2px 0;"><strong>Token: ${order.tokenNumber}</strong> (Order #: ${order.orderNumber.slice(-4)})</p>
        <p style="font-size: 0.9em; margin: 2px 0;">Total Items (Order): ${calculateTotalItemQuantity(order.items)}</p>
        ${order.tableNumber ? `<p style="font-size: 0.9em; margin: 2px 0;">Table: ${order.tableNumber}</p>` : ''}
        <p style="font-size: 0.8em; margin: 2px 0;">Time: ${new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <hr style="border: none; border-top: 1px dashed #555; margin: 8px 0;"/>
        <div style="font-size: 0.9em;">`;

    itemsToDisplay.forEach(item => {
        slipHTML += `<div style="margin-bottom: 5px;">
            <p style="font-weight: bold; margin: 0;">${item.quantity}x ${item.menuItemName}</p>`;
        if (item.selectedModifiers && item.selectedModifiers.length > 0) {
            slipHTML += `<ul style="list-style-type: none; padding-left: 15px; margin: 2px 0 0 0;">`;
            item.selectedModifiers.forEach(mod => {
                slipHTML += `<li style="font-size: 0.85em;">&nbsp;&nbsp;└ ${mod.optionName}</li>`;
            });
            slipHTML += `</ul>`;
        }
        slipHTML += `</div>`;
    });
    slipHTML += `</div></div>`;
    return slipHTML;
  };

  useEffect(() => {
    if (orderSlipToPrint) {
      const relevantItems = orderSlipToPrint.items.filter(item => 
        item.status === OrderItemStatus.AWAITING_DELIVERY || 
        item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER
      );
      if (relevantItems.length === 0) {
        setOrderSlipToPrint(null);
        return;
      }

      const timer = setTimeout(() => {
        const slipWrapper = document.getElementById('receipt-content-wrapper'); // Reusing for now
        if (slipWrapper) {
            slipWrapper.innerHTML = generateBarSlipHTML(orderSlipToPrint, relevantItems);
            slipWrapper.classList.remove('hidden'); 
        }
        window.print();
        if (slipWrapper) slipWrapper.classList.add('hidden'); 
        setOrderSlipToPrint(null); 
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderSlipToPrint]);


  const ordersForBar = useMemo(() => {
    return orders.filter(order => 
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.ON_HOLD &&
      order.items.some(item => 
        item.status === OrderItemStatus.AWAITING_DELIVERY || 
        item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER
      )
    ).sort((a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime());
  }, [orders]);

  const displayOrderStatusText = (status: OrderStatus): string => {
    if (status === OrderStatus.READY_FOR_DELIVERY) return "READY TO SERVE";
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const displayOrderItemStatusText = (status: OrderItemStatus): string => {
    if (status === OrderItemStatus.AWAITING_DELIVERY) return "READY TO SERVE";
    if (status === OrderItemStatus.DELIVERED_TO_CUSTOMER) return "SERVED";
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusColor = (itemStatus?: OrderItemStatus): string => {
    if (itemStatus === OrderItemStatus.DELIVERED_TO_CUSTOMER) return 'bg-green-100 text-green-700';
    if (itemStatus === OrderItemStatus.AWAITING_DELIVERY) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  };

  if (!ordersForBar.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <CocktailIcon className="w-24 h-24 text-gray-400 mb-6" />
        <h2 className="text-2xl font-semibold text-textPrimary mb-2">No Orders Ready to Serve</h2>
        <p className="text-textSecondary">Items ready from the kitchen will appear here once they are ready to be served to the customer.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-3xl font-bold text-primary flex items-center">
            <CocktailIcon className="w-8 h-8 mr-3 text-primary" /> Bar Display (Ready to Serve)
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto flex-grow pb-4 custom-scrollbar">
        {ordersForBar.map((order: Order) => {
          const relevantItemsForBar = order.items.filter(item => 
            item.status === OrderItemStatus.AWAITING_DELIVERY || 
            item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER
          );

          if (relevantItemsForBar.length === 0) return null; 
          
          const totalItemsInOrder = calculateTotalItemQuantity(order.items);
          const itemsAwaitingDeliveryForBar = relevantItemsForBar
              .filter(item => item.status === OrderItemStatus.AWAITING_DELIVERY)
              .reduce((sum, item) => sum + item.quantity, 0);


          let borderColorClass = 'border-gray-300'; 
          if (order.status === OrderStatus.READY_FOR_DELIVERY) borderColorClass = 'border-blue-500';
          else if (order.status === OrderStatus.DELIVERY_IN_PROGRESS) borderColorClass = 'border-purple-500';
          else if (order.status === OrderStatus.PARTIALLY_READY || order.status === OrderStatus.PREPARING) borderColorClass = 'border-yellow-500';

          let headerBgClass = 'bg-gray-100 text-gray-800'; 
          if (order.status === OrderStatus.READY_FOR_DELIVERY) headerBgClass = 'bg-blue-100 text-blue-800';
          else if (order.status === OrderStatus.DELIVERY_IN_PROGRESS) headerBgClass = 'bg-purple-100 text-purple-800';
          else if (order.status === OrderStatus.PARTIALLY_READY || order.status === OrderStatus.PREPARING) headerBgClass = 'bg-yellow-100 text-yellow-800';


          return (
            <div key={order.id} className={`bg-surface rounded-xl shadow-lg flex flex-col border-t-4 ${borderColorClass}`}>
              <div className={`p-4 ${headerBgClass} rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center">
                    Order #{order.orderNumber.slice(-4)} 
                    <span className="ml-2 text-sm font-normal">(Token: {order.tokenNumber})</span>
                  </h2>
                  <div className="flex items-center space-x-2">
                     <span className="text-sm font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">{totalItemsInOrder} item{totalItemsInOrder > 1 ? 's' : ''}</span>
                    <span className="text-sm font-medium flex items-center"><ClockIcon className="w-4 h-4 mr-1 opacity-70" /> {formatTime(order.orderTime)}</span>
                     <button 
                        onClick={() => setOrderSlipToPrint(order)} 
                        className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-200 rounded-full transition-colors"
                        title="Print Bar Slip"
                        aria-label="Print Bar Slip"
                    >
                        <PrinterIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {order.tableNumber && (
                  <p className="text-xs mt-1 flex items-center">
                      <TableCellsIcon className="w-3 h-3 mr-1 opacity-70"/> Table: {order.tableNumber}
                  </p>
                )}
              </div>

              <div className="p-4 space-y-3 flex-grow overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                {relevantItemsForBar.map((item: OrderItem) => {
                  const isDeliveredByBar = item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER;
                  
                  return (
                    <div key={item.id} className={`p-3 rounded-md shadow-sm ${getStatusColor(item.status)}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-md font-semibold ${isDeliveredByBar ? 'line-through text-gray-500' : ''}`}>
                            {item.menuItemName} 
                            <span className="text-xs ml-2 opacity-80">(x{item.quantity})</span>
                        </h3>
                      </div>
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className={`pl-4 mt-1 mb-1.5 text-xs ${isDeliveredByBar ? 'text-gray-400' : 'text-gray-700'} border-l-2 border-primary/30`}>
                          {item.selectedModifiers.map(mod => (
                            <p key={mod.optionId}>
                              + {mod.optionName} {mod.priceChange !== 0 ? <span className={isDeliveredByBar ? 'text-gray-400' : 'text-gray-500'}>(₱{mod.priceChange.toFixed(2)})</span> : ''}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {!isDeliveredByBar && item.status === OrderItemStatus.AWAITING_DELIVERY && (
                        <div className="flex space-x-2 mt-2 justify-end">
                          <button 
                            onClick={() => markOrderItemDeliveredByBar(order.id, item.id)} 
                            className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors shadow flex items-center" 
                            aria-label={`Mark ${item.menuItemName} as Served`}
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-1"/> Mark Served
                          </button>
                        </div>
                      )}
                      {isDeliveredByBar && (
                           <p className="text-xs font-medium mt-1 text-right text-green-600 flex items-center justify-end">
                               <CheckCircleIcon className="w-4 h-4 mr-1"/> {displayOrderItemStatusText(item.status)}
                           </p>
                       )}
                        {!isDeliveredByBar && item.status === OrderItemStatus.AWAITING_DELIVERY && (
                             <p className="text-xs font-medium mt-1 text-right text-blue-600 flex items-center justify-end">
                               {displayOrderItemStatusText(item.status)}
                           </p>
                        )}
                    </div>
                  );
                })}
              </div>
              {itemsAwaitingDeliveryForBar > 0 && (
                <div className="p-2 border-t border-gray-100 text-center">
                  <p className="text-sm text-blue-800 font-semibold">
                    {itemsAwaitingDeliveryForBar} item{itemsAwaitingDeliveryForBar > 1 ? 's' : ''} awaiting delivery for bar.
                  </p>
                </div>
              )}
              <div className="p-3 border-t border-gray-200 text-xs text-textSecondary">
                Overall Status: {displayOrderStatusText(order.status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarDisplayPage;
