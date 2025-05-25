import React, { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../../constants';
import { useOrder } from '../../contexts/OrderContext';
import { useMenu } from '../../contexts/MenuContext';
import { useInventory } from '../../contexts/InventoryContext';
import { ChartBarSquareIcon, SparklesIcon, LoadingSpinner } from '../../components/icons/Icons';

const AIReportPage: React.FC = () => {
  const { orders } = useOrder();
  const { menuItems, categories } = useMenu();
  const { ingredients } = useInventory();

  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize GoogleGenerativeAI
  const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = ai.getGenerativeModel({ model: "gemini-pro" });

  const examplePrompts = [
    "What were the total sales today for completed orders?",
    "List top 3 selling menu items from the last 7 days.",
    "Which ingredients are below their low stock threshold?",
    "Show me all orders with status 'PREPARING'.",
    "How many Lattes were sold this month (assuming current month is based on today's date)?",
  ];

  const handleGenerateReport = useCallback(async () => {
    if (!userInput.trim()) {
      setError("Please enter a question for the AI.");
      return;
    }
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        setError("Gemini API key not configured. AI features will not work.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setAiResponse('');

    try {
      // Prepare data snapshots
      const simplifiedOrders = orders.map(o => ({
        orderNumber: o.orderNumber,
        tokenNumber: o.tokenNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        orderTime: o.orderTime.toISOString(),
        tableNumber: o.tableNumber,
        items: o.items.map(i => ({
          name: i.menuItemName,
          quantity: i.quantity,
          priceAtOrder: i.priceAtOrder,
          status: i.status,
        }))
      }));

      const simplifiedMenuItems = menuItems.map(m => ({
        name: m.name,
        price: m.price,
        category: categories.find(c => c.id === m.categoryId)?.name || 'Unknown',
        isAvailable: m.isAvailable,
      }));

      const simplifiedIngredients = ingredients.map(i => ({
        name: i.name,
        stock: i.stock,
        lowStockThreshold: i.lowStockThreshold,
        unit: i.unit,
      }));
      
      const dataToSend = {
        orders: simplifiedOrders.slice(0, 200),
        menuItems: simplifiedMenuItems,
        ingredients: simplifiedIngredients,
      };

      const dataContextPrompt = `
        Current Date: ${new Date().toISOString()}

        Orders Data (sample, most recent first):
        ${JSON.stringify(dataToSend.orders, null, 2)}

        Menu Items Data:
        ${JSON.stringify(dataToSend.menuItems, null, 2)}

        Ingredients Data:
        ${JSON.stringify(dataToSend.ingredients, null, 2)}
      `;

      const fullPrompt = `
        You are an AI assistant for a cafe named "The Cozy Corner Cafe".
        Your task is to analyze the provided operational data and answer the user's question.
        Base your answer strictly on the data given below. Do not make up information or perform calculations beyond simple counting or summing if explicitly asked.
        If the data is insufficient or the question is too complex for the provided data, clearly state that.
        For date-related queries like "today", "yesterday", "this week", "this month", use the "Current Date" provided above as a reference.
        For sales figures, focus on orders with status 'COMPLETED'. You can also consider 'READY_FOR_DELIVERY' or 'DELIVERY_IN_PROGRESS' if the question implies broader sales activity. Explicitly exclude 'CANCELLED' and 'ON_HOLD' orders from sales totals unless specifically asked about them.
        When asked for "top items", consider item quantities sold from relevant orders.

        Available Data:
        ${dataContextPrompt}

        User Question: "${userInput}"

        Provide a concise and helpful answer. For lists (like top items or low stock items), use bullet points.
        If you list orders, include their token number, status, and total amount.
      `;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error("Received an empty response from the AI.");
      }
      setAiResponse(text.trim());

    } catch (err) {
      console.error("Error generating AI report:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while generating the report.");
    } finally {
      setIsLoading(false);
    }
  }, [userInput, orders, menuItems, categories, ingredients, model]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-8 pb-4 border-b border-gray-300">
        <ChartBarSquareIcon className="w-10 h-10 text-primary mr-3" />
        <h1 className="text-4xl font-bold text-primary">AI Powered Reports</h1>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-xl">
        <div className="mb-6">
          <label htmlFor="aiQuery" className="block text-lg font-semibold text-textPrimary mb-2">
            Ask a question about your cafe's data:
          </label>
          <textarea
            id="aiQuery"
            rows={3}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
            placeholder="e.g., What are my top selling items this week?"
          />
        </div>

        <div className="mb-6">
            <h3 className="text-sm font-medium text-textSecondary mb-1">Example Questions:</h3>
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs text-gray-500">
                {examplePrompts.map((prompt, index) => (
                    <li key={index}>
                        <button 
                            type="button" 
                            className="text-left hover:text-primary underline"
                            onClick={() => setUserInput(prompt)}
                        >
                            {prompt}
                        </button>
                    </li>
                ))}
            </ul>
        </div>


        <button
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="w-full sm:w-auto bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-5 h-5 mr-2 text-white" />
              Generating Report...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate Report
            </>
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {aiResponse && !isLoading && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-textPrimary mb-4">AI Generated Report:</h2>
            <div className="bg-gray-50 p-6 rounded-lg shadow prose max-w-none">
              {/* Simple way to render newlines from AI response */}
              {aiResponse.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIReportPage;
