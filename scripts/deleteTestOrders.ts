import { orderService } from '../services/firebaseService';

async function deleteAllOrders() {
  try {
    console.log('Fetching all orders...');
    const orders = await orderService.getAll();
    
    console.log(`Found ${orders.length} orders to delete.`);
    
    const deletePromises = orders.map(order => {
      console.log(`Deleting order ${order.id}...`);
      return orderService.delete(order.id);
    });
    
    await Promise.all(deletePromises);
    console.log('All orders have been successfully deleted.');
  } catch (error) {
    console.error('Error deleting orders:', error);
  }
}

// Execute the function
deleteAllOrders(); 