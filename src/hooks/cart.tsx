import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoBarber:cart');

      storagedProducts && setProducts(JSON.parse(storagedProducts));
    }

    loadProducts();
  }, []);

  const updateProducts = useCallback(async updatedProducts => {
    setProducts(updatedProducts);

    await AsyncStorage.setItem(
      '@GoBarber:cart',
      JSON.stringify(updatedProducts),
    );
  }, []);

  const increment = useCallback(
    id => {
      const updatedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      updateProducts(updatedProducts);
    },
    [updateProducts, products],
  );

  const decrement = useCallback(
    id => {
      const updatedProducts = products.flatMap(product => {
        if (product.id !== id) return product;

        return product.quantity === 1
          ? []
          : { ...product, quantity: product.quantity - 1 };
      });

      updateProducts(updatedProducts);
    },
    [products, updateProducts],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        increment(productExists.id);
        return;
      }

      const updatedProducts = [
        ...products,
        {
          ...product,
          quantity: 1,
        },
      ];

      updateProducts(updatedProducts);
    },
    [updateProducts, products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
