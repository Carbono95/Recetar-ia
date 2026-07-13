import { addWeeks, getISOWeek, getISOWeekYear, startOfISOWeek, subWeeks } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import mealPlanService from "../services/mealPlanService";

function toWeekLabel(date) {
  const year = getISOWeekYear(date);
  const week = String(getISOWeek(date)).padStart(2, "0");
  return `${year}-W${week}`;
}

export function useMealPlan() {
  const [weekStart, setWeekStart] = useState(() => startOfISOWeek(new Date()));
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const weekLabel = toWeekLabel(weekStart);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mealPlanService.getWeek(weekLabel);
      setEntries(data.items);
    } catch (err) {
      setError(err.message || "No se pudo cargar el planner");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekLabel]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (recipeId, date, mealType) => {
    const entry = await mealPlanService.addEntry(recipeId, date, mealType);
    setEntries((current) => [...current, entry]);
  };

  const removeEntry = async (entryId) => {
    await mealPlanService.removeEntry(entryId);
    setEntries((current) => current.filter((entry) => entry.id !== entryId));
  };

  const generateShoppingList = () => mealPlanService.generateWeeklyShoppingList(weekLabel);

  const goToPreviousWeek = () => setWeekStart((current) => subWeeks(current, 1));
  const goToNextWeek = () => setWeekStart((current) => addWeeks(current, 1));
  const goToCurrentWeek = () => setWeekStart(startOfISOWeek(new Date()));

  return {
    weekStart,
    weekLabel,
    entries,
    isLoading,
    error,
    addEntry,
    removeEntry,
    generateShoppingList,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  };
}

export default useMealPlan;
