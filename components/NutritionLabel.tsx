
import React from 'react';
import { MacroNutrients } from '../types';

export const NutritionLabel: React.FC<{ macros: MacroNutrients }> = ({ macros }) => {
  
  // Daily Value Benchmarks (based on 2000 cal diet)
  const DVs = {
    fat: 78,
    saturatedFat: 20,
    cholesterol: 300,
    sodium: 2300,
    carbs: 275,
    fiber: 28,
    addedSugar: 50,
    vitaminD: 20,
    calcium: 1300,
    iron: 18,
    potassium: 4700
  };

  const getDV = (value: number | undefined, benchmark: number) => {
    if (!value) return 0;
    return Math.round((value / benchmark) * 100);
  };

  const formatVal = (val: number | undefined) => val ?? 0;

  return (
    <div className="bg-white text-black p-4 font-sans border-2 border-black max-w-[300px] mx-auto rounded-sm shadow-lg leading-snug">
      <h2 className="text-4xl font-black border-b-[10px] border-black pb-1 mb-2 tracking-tighter">Nutrition Facts</h2>
      
      <div className="flex justify-between font-bold text-base border-b-8 border-black pb-1">
        <span>Serving Size</span>
        <span>1 Meal/Portion</span>
      </div>
      
      <div className="flex justify-between items-end border-b-4 border-black py-3">
        <div className="font-bold text-base">
          Amount Per Serving
          <div className="text-5xl font-black tracking-tight mt-1">Calories</div>
        </div>
        <div className="text-5xl font-black tracking-tight">{formatVal(macros.calories)}</div>
      </div>
      
      <div className="text-right text-xs font-bold pt-1 pb-1 border-b border-black">% Daily Value*</div>

      {/* Fat Group */}
      <div className="border-b border-black py-1 text-sm flex justify-between">
        <div><span className="font-bold">Total Fat</span> {formatVal(macros.fat)}g</div>
        <div className="font-bold">{getDV(macros.fat, DVs.fat)}%</div>
      </div>
      <div className="border-b border-black py-1 pl-4 text-sm flex justify-between">
         <div>Saturated Fat {formatVal(macros.saturatedFat)}g</div>
         <div className="font-bold">{getDV(macros.saturatedFat, DVs.saturatedFat)}%</div>
      </div>
      <div className="border-b border-black py-1 pl-4 text-sm italic">
         Trans Fat {formatVal(macros.transFat)}g
      </div>

      {/* Cholesterol & Sodium */}
      <div className="border-b border-black py-1 text-sm flex justify-between">
        <div><span className="font-bold">Cholesterol</span> {formatVal(macros.cholesterol)}mg</div>
        <div className="font-bold">{getDV(macros.cholesterol, DVs.cholesterol)}%</div>
      </div>
      <div className="border-b border-black py-1 text-sm flex justify-between">
        <div><span className="font-bold">Sodium</span> {formatVal(macros.sodium)}mg</div>
        <div className="font-bold">{getDV(macros.sodium, DVs.sodium)}%</div>
      </div>

      {/* Carbs Group */}
      <div className="border-b border-black py-1 text-sm flex justify-between">
        <div><span className="font-bold">Total Carbohydrate</span> {formatVal(macros.carbs)}g</div>
        <div className="font-bold">{getDV(macros.carbs, DVs.carbs)}%</div>
      </div>
      <div className="border-b border-black py-1 pl-4 text-sm flex justify-between">
        <div>Dietary Fiber {formatVal(macros.fiber)}g</div>
        <div className="font-bold">{getDV(macros.fiber, DVs.fiber)}%</div>
      </div>
      <div className="border-b border-black py-1 pl-4 text-sm">
        Total Sugars {formatVal(macros.sugar)}g
      </div>
      <div className="border-b border-black py-1 pl-8 text-sm flex justify-between">
        <div>Includes {formatVal(macros.addedSugar)}g Added Sugars</div>
        <div className="font-bold">{getDV(macros.addedSugar, DVs.addedSugar)}%</div>
      </div>

      {/* Protein */}
      <div className="border-b-[10px] border-black py-1 text-sm font-bold">
        <span className="">Protein</span> {formatVal(macros.protein)}g
      </div>
      
      {/* Vitamins & Minerals */}
      <div className="border-b border-black py-1 text-sm flex justify-between">
         <div>Vitamin D {formatVal(macros.vitaminD)}mcg</div>
         <div>{getDV(macros.vitaminD, DVs.vitaminD)}%</div>
      </div>
      <div className="border-b border-black py-1 text-sm flex justify-between">
         <div>Calcium {formatVal(macros.calcium)}mg</div>
         <div>{getDV(macros.calcium, DVs.calcium)}%</div>
      </div>
      <div className="border-b border-black py-1 text-sm flex justify-between">
         <div>Iron {formatVal(macros.iron)}mg</div>
         <div>{getDV(macros.iron, DVs.iron)}%</div>
      </div>
      <div className="border-b border-black py-1 text-sm flex justify-between">
         <div>Potassium {formatVal(macros.potassium)}mg</div>
         <div>{getDV(macros.potassium, DVs.potassium)}%</div>
      </div>
      
      <div className="pt-4 text-[10px] leading-tight text-gray-600">
        * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
      </div>
    </div>
  );
};
