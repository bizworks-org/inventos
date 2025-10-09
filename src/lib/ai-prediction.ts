// Mock AI prediction for asset replacement cycles
// In a real application, this would integrate with Genkit and Gemini

export interface AssetPredictionInput {
  assetType: string;
  usagePattern: 'Light' | 'Medium' | 'Heavy';
  maintenanceHistory: 'Good' | 'Fair' | 'Poor';
  ageInMonths: number;
  originalCost: number;
}

export interface AssetPredictionOutput {
  predictedReplacementMonths: number;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
  costProjection: {
    maintenanceCost: number;
    replacementCost: number;
    totalCostOfOwnership: number;
  };
}

// Mock prediction function that simulates AI analysis
export async function predictAssetReplacementCycle(
  input: AssetPredictionInput
): Promise<AssetPredictionOutput> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Base replacement timeline by asset type (in months)
  const baseTimelines: Record<string, number> = {
    'Laptop': 36,
    'Desktop': 48,
    'Server': 60,
    'Monitor': 60,
    'Phone': 24,
    'Printer': 48
  };

  const baseMonths = baseTimelines[input.assetType] || 36;
  
  // Adjust based on usage pattern
  const usageMultiplier = {
    'Light': 1.3,
    'Medium': 1.0,
    'Heavy': 0.7
  }[input.usagePattern] || 1.0;

  // Adjust based on maintenance history
  const maintenanceMultiplier = {
    'Good': 1.2,
    'Fair': 1.0,
    'Poor': 0.8
  }[input.maintenanceHistory] || 1.0;

  // Calculate predicted months
  const predictedMonths = Math.round(
    baseMonths * usageMultiplier * maintenanceMultiplier
  );

  // Calculate remaining months
  const remainingMonths = Math.max(0, predictedMonths - input.ageInMonths);

  // Calculate costs
  const annualMaintenanceRate = input.maintenanceHistory === 'Poor' ? 0.15 : 
                                input.maintenanceHistory === 'Fair' ? 0.10 : 0.05;
  const maintenanceCost = Math.round(
    input.originalCost * annualMaintenanceRate * (remainingMonths / 12)
  );
  
  const replacementCost = Math.round(input.originalCost * 1.1); // Assume 10% price increase
  const totalCostOfOwnership = maintenanceCost + replacementCost;

  // Generate reasoning
  const reasoning = generateReasoning(input, predictedMonths, remainingMonths);

  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(
    input,
    remainingMonths,
    maintenanceCost,
    replacementCost
  );

  // Calculate confidence based on data quality
  const confidence = calculateConfidence(input);

  return {
    predictedReplacementMonths: remainingMonths,
    confidence,
    reasoning,
    suggestedActions,
    costProjection: {
      maintenanceCost,
      replacementCost,
      totalCostOfOwnership
    }
  };
}

function generateReasoning(
  input: AssetPredictionInput,
  totalLifespan: number,
  remainingMonths: number
): string {
  const parts = [];

  parts.push(`Based on the analysis of your ${input.assetType.toLowerCase()}, which is currently ${input.ageInMonths} months old,`);
  
  parts.push(`I've determined an expected total lifespan of approximately ${totalLifespan} months.`);

  if (input.usagePattern === 'Heavy') {
    parts.push(`The heavy usage pattern accelerates wear and tear, reducing the typical replacement cycle.`);
  } else if (input.usagePattern === 'Light') {
    parts.push(`The light usage pattern extends the asset's viable operational life beyond typical expectations.`);
  }

  if (input.maintenanceHistory === 'Good') {
    parts.push(`The excellent maintenance history suggests the asset has been well-cared for, potentially extending its useful life.`);
  } else if (input.maintenanceHistory === 'Poor') {
    parts.push(`The suboptimal maintenance history indicates accelerated degradation and increased failure risk.`);
  }

  if (remainingMonths <= 6) {
    parts.push(`With only ${remainingMonths} months remaining, immediate replacement planning is recommended.`);
  } else if (remainingMonths <= 12) {
    parts.push(`With ${remainingMonths} months of serviceable life remaining, you should begin budgeting for replacement soon.`);
  } else {
    parts.push(`The asset has approximately ${remainingMonths} months of optimal performance remaining before replacement consideration.`);
  }

  return parts.join(' ');
}

function generateSuggestedActions(
  input: AssetPredictionInput,
  remainingMonths: number,
  maintenanceCost: number,
  replacementCost: number
): string[] {
  const actions: string[] = [];

  if (remainingMonths <= 3) {
    actions.push('🚨 Initiate immediate replacement procurement process');
    actions.push('📋 Develop data migration and transition plan');
    actions.push('💰 Secure budget approval for replacement ($' + replacementCost.toLocaleString() + ')');
  } else if (remainingMonths <= 6) {
    actions.push('📅 Schedule replacement within next quarter');
    actions.push('🔍 Research current market options and pricing');
    actions.push('💾 Begin backup and data inventory process');
  } else if (remainingMonths <= 12) {
    actions.push('📊 Add to next fiscal year capital expenditure plan');
    actions.push('🔧 Increase maintenance monitoring frequency');
    actions.push('📈 Track performance metrics for replacement timing');
  } else {
    actions.push('✅ Continue current maintenance schedule');
    actions.push('📝 Document asset performance and issues');
    actions.push('💡 Consider early replacement if new technology provides significant ROI');
  }

  if (maintenanceCost > replacementCost * 0.3) {
    actions.push('⚠️ High projected maintenance costs suggest earlier replacement may be cost-effective');
  }

  if (input.maintenanceHistory === 'Poor') {
    actions.push('🛠️ Implement improved maintenance protocols to extend asset lifespan');
  }

  return actions;
}

function calculateConfidence(input: AssetPredictionInput): number {
  let confidence = 85; // Base confidence

  // Reduce confidence for extreme ages
  if (input.ageInMonths > 60) {
    confidence -= 10;
  }

  // Adjust for maintenance history quality
  if (input.maintenanceHistory === 'Poor') {
    confidence -= 5;
  } else if (input.maintenanceHistory === 'Good') {
    confidence += 5;
  }

  return Math.min(95, Math.max(70, confidence));
}
