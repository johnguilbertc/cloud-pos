import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useOrder } from '../../contexts/OrderContext';
import { useUser } from '../../contexts/UserContext';
import { useMenu } from '../../contexts/MenuContext';
import { Order, OrderItem, OrderStatus, OrderItemStatus, UserRole, Category } from '../../types';
import { KdsIcon, ClockIcon, CogIcon, CheckCircleIcon, MinusCircleIcon, TableCellsIcon, SpeakerWaveIcon, SpeakerXMarkIcon, PrinterIcon } from '../../components/icons/Icons';

const calculateTotalItemQuantity = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

const KDSPage: React.FC = () => {
  const { orders, updateOrderItemStatus } = useOrder();
  const { currentUser } = useUser();
  const { getMenuItemById, getCategoryById, categories } = useMenu();

  const [selectedKdsCategoryIds, setSelectedKdsCategoryIds] = useState<string[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    const savedSoundPref = localStorage.getItem('kdsSoundEnabled');
    return savedSoundPref !== null ? JSON.parse(savedSoundPref) : true;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedOrderTimestampsRef = useRef<Map<string, number>>(new Map());
  const isInitialMountRef = useRef(true);
  const [orderSlipToPrint, setOrderSlipToPrint] = useState<Order | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // FIX: Moved userVisibleCategories and finalFilterCategoryIds declarations before their use.
  const userVisibleCategories = useMemo(() => {
    if (currentUser?.role === UserRole.KITCHEN_STAFF && currentUser.assignedCategoryIds?.length) {
      return categories.filter(cat => currentUser.assignedCategoryIds!.includes(cat.id));
    }
    return categories; 
  }, [categories, currentUser]);

  const finalFilterCategoryIds = useMemo(() => {
    const baseVisibleIds = userVisibleCategories.map(c => c.id);
    if (selectedKdsCategoryIds.length === 0) {
      return baseVisibleIds; 
    }
    return selectedKdsCategoryIds.filter(id => baseVisibleIds.includes(id));
  }, [selectedKdsCategoryIds, userVisibleCategories]);


  useEffect(() => {
    localStorage.setItem('kdsSoundEnabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  const initializeAudio = useCallback(async () => {
    if (isAudioInitialized) return;

    try {
      const context = new AudioContext();
      const response = await fetch('/notification.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await context.decodeAudioData(arrayBuffer);
      
      setAudioContext(context);
      setAudioBuffer(buffer);
      setIsAudioInitialized(true);
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }, [isAudioInitialized]);

  useEffect(() => {
    const handleClick = () => {
      if (!isAudioInitialized) {
        initializeAudio();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isAudioInitialized, initializeAudio]);

  useEffect(() => {
    if (!audioContext || !audioBuffer || !isAudioInitialized) return;

    const playSound = () => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    };

    orders.forEach(order => {
      if (order.lastKDSNotifiedTime && Date.now() - order.lastKDSNotifiedTime < 5000) {
        playSound();
      }
    });
  }, [orders, audioContext, audioBuffer, isAudioInitialized]);

  const playNotificationSound = useCallback(() => {
    if (!isSoundEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioContextRef.current;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5); 

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5); 
  }, [isSoundEnabled]);

  const generateOrderSlipHTML = useCallback((order: Order, itemsToDisplay: OrderItem[]): string => {
    let slipHTML = `<div style="font-family: 'Arial', sans-serif; width: 300px; padding: 10px; border: 1px solid #333;">
        <h2 style="text-align: center; font-size: 1.2em; margin: 0 0 5px 0;">KDS Slip</h2>
        <p style="font-size: 0.9em; margin: 2px 0;"><strong>Token: ${order.tokenNumber}</strong> (Order #: ${order.orderNumber.slice(-4)})</p>
        <p style="font-size: 0.9em; margin: 2px 0;">Total Items: ${calculateTotalItemQuantity(order.items)}</p>
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
  }, []);

  useEffect(() => {
    if (orderSlipToPrint) {
      const relevantItems = orderSlipToPrint.items.filter(item => {
          const menuItem = getMenuItemById(item.menuItemId);
          return menuItem && finalFilterCategoryIds.includes(menuItem.categoryId) &&
                 (item.status === OrderItemStatus.PENDING || 
                  item.status === OrderItemStatus.PREPARING ||
                  item.status === OrderItemStatus.READY ||
                  item.status === OrderItemStatus.AWAITING_DELIVERY);
      });

      if (relevantItems.length === 0) {
        setOrderSlipToPrint(null); // Don't print if no relevant items for current KDS filter
        return;
      }

      const timer = setTimeout(() => {
        const slipWrapper = document.getElementById('receipt-content-wrapper'); // Reusing for now
        if (slipWrapper) {
            slipWrapper.innerHTML = generateOrderSlipHTML(orderSlipToPrint, relevantItems);
            slipWrapper.classList.remove('hidden'); 
        }
        window.print();
        if (slipWrapper) slipWrapper.classList.add('hidden'); 
        setOrderSlipToPrint(null); 
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderSlipToPrint, getMenuItemById, finalFilterCategoryIds, generateOrderSlipHTML]);


  const getStatusColor = (status: OrderItemStatus | OrderStatus): string => {
    switch (status) {
      case OrderItemStatus.PENDING:
      case OrderStatus.PENDING:
        return 'bg-gray-200 text-gray-700';
      case OrderItemStatus.PREPARING:
      case OrderStatus.PREPARING:
        return 'bg-yellow-200 text-yellow-800';
      case OrderItemStatus.READY: 
      case OrderItemStatus.AWAITING_DELIVERY: 
      case OrderStatus.PARTIALLY_READY:
      case OrderStatus.READY_FOR_DELIVERY: 
        return 'bg-green-200 text-green-800';
      case OrderItemStatus.CANCELLED:
      case OrderStatus.CANCELLED:
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: OrderItemStatus | OrderStatus) => {
    const iconClass = "w-5 h-5 mr-2";
    switch (status) {
      case OrderItemStatus.PENDING:
      case OrderStatus.PENDING:
        return <ClockIcon className={`${iconClass} text-gray-500`} />;
      case OrderItemStatus.PREPARING:
      case OrderStatus.PREPARING:
        return <CogIcon className={`${iconClass} text-yellow-600`} />;
      case OrderItemStatus.READY:
      case OrderItemStatus.AWAITING_DELIVERY:
      case OrderStatus.PARTIALLY_READY:
      case OrderStatus.READY_FOR_DELIVERY:
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case OrderItemStatus.CANCELLED:
      case OrderStatus.CANCELLED:
        return <MinusCircleIcon className={`${iconClass} text-red-600`} />;
      default:
        return null;
    }
  };

  const displayOrderStatusText = (status: OrderStatus): string => {
    if (status === OrderStatus.READY_FOR_DELIVERY) return "READY TO SERVE";
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const displayOrderItemStatusText = (status: OrderItemStatus): string => {
    if (status === OrderItemStatus.READY || status === OrderItemStatus.AWAITING_DELIVERY) return "READY TO SERVE";
    if (status === OrderItemStatus.DELIVERED_TO_CUSTOMER) return "DELIVERED";
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const filteredAndSortedOrders = useMemo(() => {
    let displayOrders = orders.filter(order => 
        order.status !== OrderStatus.COMPLETED && 
        order.status !== OrderStatus.CANCELLED &&
        order.status !== OrderStatus.DELIVERY_IN_PROGRESS && 
        order.status !== OrderStatus.ON_HOLD 
    );
    
    displayOrders = displayOrders.filter(order => 
        order.items.some(item => {
            const menuItem = getMenuItemById(item.menuItemId);
            return menuItem && finalFilterCategoryIds.includes(menuItem.categoryId) && 
                   (item.status === OrderItemStatus.PENDING || 
                    item.status === OrderItemStatus.PREPARING ||
                    item.status === OrderItemStatus.READY || 
                    item.status === OrderItemStatus.AWAITING_DELIVERY); 
        })
    );

    return displayOrders.sort((a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime());
  }, [orders, getMenuItemById, finalFilterCategoryIds]);
  
  
  useEffect(() => {
    if (isInitialMountRef.current) {
      filteredAndSortedOrders.forEach(order => {
        if(order.lastKDSNotifiedTime) {
            lastPlayedOrderTimestampsRef.current.set(order.id, order.lastKDSNotifiedTime);
        }
      });
      isInitialMountRef.current = false;
      return;
    }

    let newOrderDetected = false;
    filteredAndSortedOrders.forEach(order => {
        if (order.lastKDSNotifiedTime) {
            const lastPlayedTime = lastPlayedOrderTimestampsRef.current.get(order.id);
            if (!lastPlayedTime || order.lastKDSNotifiedTime > lastPlayedTime) {
                newOrderDetected = true;
                lastPlayedOrderTimestampsRef.current.set(order.id, order.lastKDSNotifiedTime);
            }
        }
    });

    if (newOrderDetected && isSoundEnabled) {
        playNotificationSound();
    }
  }, [filteredAndSortedOrders, playNotificationSound, isSoundEnabled]);


  const handleItemStatusChange = (orderId: string, itemId: string, newStatus: OrderItemStatus) => {
    updateOrderItemStatus(orderId, itemId, newStatus);
  };
  
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    setSelectedKdsCategoryIds(prevSelectedIds => {
      if (categoryId === 'all') { 
        return [];
      }
      const newSelectedIds = prevSelectedIds.includes(categoryId)
        ? prevSelectedIds.filter(id => id !== categoryId)
        : [...prevSelectedIds, categoryId];
      
      return newSelectedIds.length === 0 && userVisibleCategories.length > 0 && newSelectedIds.length !== userVisibleCategories.length ? [] : newSelectedIds;
    });
  };
  
  const isAllCategoriesSelected = selectedKdsCategoryIds.length === 0;

  const getNoOrdersMessage = () => {
    if (isAllCategoriesSelected) {
        return currentUser?.role === UserRole.KITCHEN_STAFF && currentUser.assignedCategoryIds?.length
            ? "There are currently no active orders matching your assigned categories."
            : "There are currently no active orders."
    } else {
        const selectedNames = selectedKdsCategoryIds.map(id => getCategoryById(id)?.name).filter(Boolean).join(', ');
        return `No active orders for selected categories: ${selectedNames || 'Unknown'}.`;
    }
  }


  if (!filteredAndSortedOrders.length && !isInitialMountRef.current) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-300 gap-3">
            <h1 className="text-3xl font-bold text-primary flex items-center">
                <KdsIcon className="w-8 h-8 mr-3 text-primary" /> Kitchen Display
            </h1>
             <button onClick={toggleSound} title={isSoundEnabled ? "Disable Sound" : "Enable Sound"} className="p-2 rounded-full hover:bg-gray-200 transition-colors self-start sm:self-center">
                {isSoundEnabled ? <SpeakerWaveIcon className="w-6 h-6 text-primary" /> : <SpeakerXMarkIcon className="w-6 h-6 text-gray-500" />}
            </button>
        </div>
         <div className="mb-4 flex flex-wrap gap-2 items-center">
            <button
                onClick={() => handleCategoryFilterChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm
                            ${isAllCategoriesSelected ? 'bg-primary text-white' : 'bg-surface text-textPrimary border border-gray-300 hover:bg-gray-100'}`}
            >
                {currentUser?.role === UserRole.KITCHEN_STAFF && currentUser.assignedCategoryIds?.length ? 'All My Assigned' : 'All Categories'}
            </button>
            {userVisibleCategories.map(cat => (
                <button 
                    key={cat.id} 
                    onClick={() => handleCategoryFilterChange(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm
                                ${selectedKdsCategoryIds.includes(cat.id) ? 'bg-primary text-white' : 'bg-surface text-textPrimary border border-gray-300 hover:bg-gray-100'}`}
                    aria-pressed={selectedKdsCategoryIds.includes(cat.id)}
                >
                    {cat.name}
                </button>
            ))}
        </div>
        <div className="flex-grow flex flex-col items-center justify-center text-center">
            <KdsIcon className="w-24 h-24 text-gray-400 mb-6" />
            <h2 className="text-2xl font-semibold text-textPrimary mb-2">No Active Orders</h2>
            <p className="text-textSecondary">{getNoOrdersMessage()}</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  return (
    <div className="container mx-auto p-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-300 gap-3">
        <h1 className="text-3xl font-bold text-primary flex items-center">
            <KdsIcon className="w-8 h-8 mr-3 text-primary" /> Kitchen Display
        </h1>
        <div className="flex items-center gap-3">
             <button onClick={toggleSound} title={isSoundEnabled ? "Disable Sound" : "Enable Sound"} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                {isSoundEnabled ? <SpeakerWaveIcon className="w-6 h-6 text-primary" /> : <SpeakerXMarkIcon className="w-6 h-6 text-gray-500" />}
            </button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 items-center">
            <button
                onClick={() => handleCategoryFilterChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm
                            ${isAllCategoriesSelected ? 'bg-primary text-white' : 'bg-surface text-textPrimary border border-gray-300 hover:bg-gray-100'}`}
            >
                 {currentUser?.role === UserRole.KITCHEN_STAFF && currentUser.assignedCategoryIds?.length ? 'All My Assigned' : 'All Categories'}
            </button>
            {userVisibleCategories.map(cat => (
                <button 
                    key={cat.id} 
                    onClick={() => handleCategoryFilterChange(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm
                                ${selectedKdsCategoryIds.includes(cat.id) ? 'bg-primary text-white' : 'bg-surface text-textPrimary border border-gray-300 hover:bg-gray-100'}`}
                    aria-pressed={selectedKdsCategoryIds.includes(cat.id)}
                >
                    {cat.name}
                </button>
            ))}
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto flex-grow pb-4 custom-scrollbar">
        {filteredAndSortedOrders.map((order: Order) => {
             const itemsForThisKDSView = order.items.filter(item => {
                const menuItem = getMenuItemById(item.menuItemId);
                return menuItem && finalFilterCategoryIds.includes(menuItem.categoryId) && 
                       (item.status === OrderItemStatus.PENDING || 
                        item.status === OrderItemStatus.PREPARING ||
                        item.status === OrderItemStatus.READY ||
                        item.status === OrderItemStatus.AWAITING_DELIVERY);
            });

            if (itemsForThisKDSView.length === 0) return null; 
            
            const totalItemsInOrder = calculateTotalItemQuantity(order.items);
            const pendingOrPreparingItemsInView = itemsForThisKDSView
                .filter(item => item.status === OrderItemStatus.PENDING || item.status === OrderItemStatus.PREPARING)
                .reduce((sum, item) => sum + item.quantity, 0);


          return (
            <div key={order.id} className={`bg-surface rounded-xl shadow-lg flex flex-col border-t-4 ${
                order.status === OrderStatus.PREPARING ? 'border-yellow-500' :
                order.status === OrderStatus.PARTIALLY_READY ? 'border-blue-500' :
                order.status === OrderStatus.READY_FOR_DELIVERY ? 'border-green-500' :
                'border-gray-400'
            }`}>
              <div className={`p-4 ${getStatusColor(order.status)} rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center">
                    {getStatusIcon(order.status)} Order #{order.orderNumber.slice(-4)} 
                    <span className="ml-2 text-sm font-normal">(Token: {order.tokenNumber})</span>
                  </h2>
                   <div className="flex items-center space-x-2">
                     <span className="text-sm font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">{totalItemsInOrder} item{totalItemsInOrder > 1 ? 's' : ''}</span>
                    <span className="text-sm font-medium">{formatTime(order.orderTime)}</span>
                    <button 
                        onClick={() => setOrderSlipToPrint(order)} 
                        className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-200 rounded-full transition-colors"
                        title="Print KDS Slip"
                        aria-label="Print KDS Slip"
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

              <div className="p-4 space-y-3 flex-grow overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                {itemsForThisKDSView
                  .map((item: OrderItem) => (
                  <div key={item.id} className={`p-3 rounded-md shadow-sm ${getStatusColor(item.status)}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-md font-semibold flex items-center">
                          {getStatusIcon(item.status)} {item.menuItemName} 
                          <span className="text-xs ml-2 opacity-80">(x{item.quantity})</span>
                      </h3>
                    </div>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="pl-4 mt-1 mb-1.5 text-xs text-gray-700 border-l-2 border-primary/30">
                        {item.selectedModifiers.map(mod => (
                          <p key={mod.optionId}>
                            + {mod.optionName} {mod.priceChange !== 0 ? <span className="text-gray-500">(₱{mod.priceChange.toFixed(2)})</span> : ''}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {item.status !== OrderItemStatus.CANCELLED && item.status !== OrderItemStatus.READY && item.status !== OrderItemStatus.AWAITING_DELIVERY && item.status !== OrderItemStatus.DELIVERED_TO_CUSTOMER && (
                      <div className="flex space-x-2 mt-2 justify-end">
                        {item.status !== OrderItemStatus.PREPARING && (
                          <button onClick={() => handleItemStatusChange(order.id, item.id, OrderItemStatus.PREPARING)} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors shadow" aria-label={`Mark ${item.menuItemName} as Preparing`}>Preparing</button>
                        )}
                        <button onClick={() => handleItemStatusChange(order.id, item.id, OrderItemStatus.READY)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors shadow" aria-label={`Mark ${item.menuItemName} as Ready to Serve`}>Ready to Serve</button>
                        {/* Cancel button removed from KDS */}
                      </div>
                    )}
                     {(item.status === OrderItemStatus.READY || item.status === OrderItemStatus.AWAITING_DELIVERY || item.status === OrderItemStatus.CANCELLED || item.status === OrderItemStatus.DELIVERED_TO_CUSTOMER) && (
                          <p className="text-xs font-medium mt-1 text-right opacity-90">Status: {displayOrderItemStatusText(item.status)}</p>
                      )}
                  </div>
                ))}
              </div>
              {pendingOrPreparingItemsInView > 0 && (
                <div className="p-2 border-t border-gray-100 text-center">
                  <p className="text-sm text-yellow-800 font-semibold">
                    {pendingOrPreparingItemsInView} item{pendingOrPreparingItemsInView > 1 ? 's' : ''} pending/preparing for this view.
                  </p>
                </div>
              )}
              <div className="p-3 border-t border-gray-200 text-xs text-textSecondary">
                Overall: {displayOrderStatusText(order.status)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default KDSPage;
