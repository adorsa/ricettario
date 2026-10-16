import { inject, Service } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IngredientsMap } from './recipe.model';

@Service()
export class RecipeParser {
  private sanitizer = inject(DomSanitizer);
  
  private readonly ingredientRegex = /\[i:([a-zA-Z0-9_]+)(?::([\d.]+))?\]/g;
  private readonly timerRegex = /\[t:(\d+):([^\]]+)\]/g;

  parseStepText(text: string, ingredients: IngredientsMap, multiplier: number): SafeHtml {
    let parsedText = text;

    this.ingredientRegex.lastIndex = 0;
    parsedText = parsedText.replace(this.ingredientRegex, (match, ingId, quotaStr) => {
      const ingredient = ingredients[ingId];
      if (!ingredient) return `<span class="text-red-500">[missing ingredient]</span>`;
      const quota = quotaStr ? parseFloat(quotaStr) : 1;
      const finalQty = ingredient.qty * multiplier * quota;
      const formattedQty = +finalQty.toFixed(2);
      
      const qtyString = formattedQty > 0 ? `${formattedQty}${ingredient.unit} of ` : '';
      return `<strong class="ingredient-tag bg-amber-100 text-amber-900 px-1 rounded">${qtyString}${ingredient.name}</strong>`;
    });

    this.timerRegex.lastIndex = 0;
    parsedText = parsedText.replace(this.timerRegex, (match, minutes, label) => {
      return `<button class="timer-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-0.5 px-2 rounded text-sm inline-flex items-center gap-1" data-minutes="${minutes}">
                ⏱️ ${label}
              </button>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(parsedText);
  }
}