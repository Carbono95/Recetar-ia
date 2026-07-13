import { useCallback, useEffect, useState } from "react";

import shoppingService from "../services/shoppingService";

export function useShopping() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shoppingService.get();
      setItems(data.items);
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de compra");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const generateList = async (recipeIds) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shoppingService.generate(recipeIds);
      setItems(data.items);
    } catch (err) {
      setError(err.message || "No se pudo generar la lista de compra");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChecked = async (itemId, checked) => {
    const previousItems = items;
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, checked } : item)));
    try {
      await shoppingService.checkItem(itemId, checked);
    } catch (err) {
      setItems(previousItems);
      window.alert(err.message || "No se pudo actualizar el ingrediente");
    }
  };

  const clearList = async () => {
    await shoppingService.clear();
    setItems([]);
  };

  return { items, isLoading, error, generateList, toggleChecked, clearList };
}

export default useShopping;
