// recipe.model.ts

export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

export interface IngredientsMap {
  [id: string]: Ingredient;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  servings_base: number;
  ingredients: IngredientsMap;
  steps: string[];
  created_at?: string;
}

// Dati di test (Mock) basati sulle specifiche del tuo documento
export const MOCK_RECIPE: Recipe = {
  id: 'rec_001',
  user_id: 'user_123',
  title: 'Torta Semplice MVP',
  servings_base: 4, // Porzioni standard
  ingredients: {
    ing_1: { name: 'Farina 00', qty: 200, unit: 'g' },
    ing_2: { name: 'Uova', qty: 2, unit: '' },
    ing_3: { name: 'Zucchero', qty: 100, unit: 'g' }
  },
  steps: [
    'In una ciotola capiente, versa [i:ing_1:0.5] (metà della farina) e aggiungi [i:ing_2].',
    'Mescola energicamente per [t:5:5 minuti] fino a ottenere un composto omogeneo.',
    'Aggiungi il resto della farina ([i:ing_1:0.5]) e tutto lo zucchero ([i:ing_3]).',
    'Inforna e lascia cuocere per [t:30:mezz\'ora].'
  ]
};
