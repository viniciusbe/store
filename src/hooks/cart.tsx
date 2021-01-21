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
      const storagedProducts = await AsyncStorage.getItem('@GoBarber/cart');

      storagedProducts && setProducts(JSON.parse(storagedProducts));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(product => {
        if (product.id !== id) return product;

        return {
          ...product,
          quantity: product.quantity + 1,
        };
      });

      await AsyncStorage.setItem(
        '@GoBarber/cart',
        JSON.stringify(productsUpdated),
      );

      setProducts(productsUpdated);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExistent = products.find(
        productX => product.id === productX.id,
      );

      if (productExistent) {
        increment(productExistent.id);
        return;
      }

      const createProduct: Product = {
        ...product,
        quantity: 1,
      };

      await AsyncStorage.setItem(
        '@GoBarber/cart',
        JSON.stringify([...products, createProduct]),
      );

      setProducts([...products, createProduct]);
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const productsUpdated = products.flatMap(product => {
        if (product.id !== id) return product;

        const { quantity } = product;

        if (quantity === 1) return [];

        return { ...product, quantity: product.quantity - 1 };
      });

      await AsyncStorage.setItem(
        '@GoBarber/cart',
        JSON.stringify(productsUpdated),
      );

      setProducts(productsUpdated);
    },
    [products],
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
