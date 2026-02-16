# Economic Threshold Calculation

## Overview

The economic threshold calculation determines the maximum scarab price at which vendoring three scarabs using the 3-to-1 recipe is profitable with a specified confidence level (e.g., 90% certainty).

The calculation uses statistical methods to account for variance in scarab prices, ensuring that scarabs below the threshold have a high probability of being profitable when enough trades are performed.

## Input Parameters

```
Input:
  - scarabs: Array of Scarab objects
  - confidencePercentile: Number between 0 and 1 (default: 0.9 for 90% confidence)
  - numberOfTrades: Number of trades to consider (default: 10000)
  
Each Scarab object contains:
  - dropWeight: Number (probability weight for vendor recipe)
  - chaosValue: Number (price in chaos orbs)
```

**Important:** The calculation uses the **sampling distribution of the mean** for multiple trades, not the population distribution. This means we use the standard error (`σ / √n`) instead of the population standard deviation (`σ`).

## Calculation Process

### Step 1: Filter Valid Scarabs

```pseudocode
FUNCTION calculateThreshold(scarabs, confidencePercentile = 0.9, numberOfTrades = 10000):
  
  // Filter scarabs with both drop weight and price data
  validScarabs = FILTER scarabs WHERE
    scarab.hasDropWeight() == true AND
    scarab.hasPriceData() == true
  
  IF validScarabs.length == 0:
    THROW ERROR "No valid Scarabs with both dropWeight and price data"
  
  RETURN calculateThresholdFromValidScarabs(validScarabs, confidencePercentile, numberOfTrades)
END FUNCTION
```

### Step 2: Calculate Total Weight

```pseudocode
FUNCTION calculateTotalWeight(validScarabs):
  totalWeight = SUM OF scarab.dropWeight FOR ALL scarabs IN validScarabs
  
  IF totalWeight <= 0:
    THROW ERROR "Total weight must be greater than 0"
  
  RETURN totalWeight
END FUNCTION
```

### Step 3: Calculate Expected Value (Weighted Average)

```pseudocode
FUNCTION calculateExpectedValue(validScarabs, totalWeight):
  expectedValue = 0
  
  FOR EACH scarab IN validScarabs:
    probability = scarab.dropWeight / totalWeight
    value = scarab.chaosValue
    expectedValue = expectedValue + (probability × value)
  
  RETURN expectedValue
END FUNCTION
```

**Mathematical Formula:**
```
E[X] = Σ (weight_i / total_weight × price_i)
```

### Step 4: Calculate Variance

```pseudocode
FUNCTION computeVariance(scarabs, totalWeight, expectedValue):
  variance = 0
  
  FOR EACH scarab IN scarabs:
    probability = scarab.dropWeight / totalWeight
    diff = scarab.chaosValue - expectedValue
    variance = variance + (probability × diff × diff)
  
  RETURN variance
END FUNCTION
```

**Mathematical Formula:**
```
Var[X] = Σ (probability_i × (value_i - E[X])²)
```

### Step 5: Calculate Standard Deviation and Standard Error

```pseudocode
FUNCTION calculateStandardDeviationAndError(variance, numberOfTrades):
  // Population standard deviation
  populationStandardDeviation = SQRT(variance)
  
  // Standard error of the mean for sampling distribution
  // For n trades: X̄ ~ N(μ, σ²/n), so standard_error = σ / √n
  standardError = populationStandardDeviation / SQRT(numberOfTrades)
  
  RETURN (populationStandardDeviation, standardError)
END FUNCTION
```

**Mathematical Foundation:**
- **Population distribution**: Single trade outcome ~ N(μ, σ²)
- **Sampling distribution**: Mean of n trades ~ N(μ, σ²/n)
- **Standard Error**: SE = σ / √n (decreases with more trades)

### Step 6: Get Z-Score for Confidence Percentile

```pseudocode
FUNCTION getZScore(percentile):
  // Predefined z-scores for common confidence levels
  zScores = {
    0.80: 0.84162,  // 80th percentile
    0.85: 1.03643,  // 85th percentile
    0.90: 1.28155,  // 90th percentile
    0.95: 1.64485,  // 95th percentile
    0.99: 2.32635   // 99th percentile
  }
  
  IF percentile EXISTS IN zScores:
    RETURN zScores[percentile]
  
  // Linear interpolation for values between known percentiles
  sortedPercentiles = SORT(KEYS(zScores))
  
  IF percentile < MIN(sortedPercentiles):
    RETURN zScores[MIN(sortedPercentiles)]
  
  IF percentile > MAX(sortedPercentiles):
    RETURN zScores[MAX(sortedPercentiles)]
  
  // Find bounding percentiles
  lowerPercentile, upperPercentile = FIND_BOUNDING_PERCENTILES(percentile, sortedPercentiles)
  
  // Linear interpolation
  lowerZ = zScores[lowerPercentile]
  upperZ = zScores[upperPercentile]
  ratio = (percentile - lowerPercentile) / (upperPercentile - lowerPercentile)
  
  RETURN lowerZ + (upperZ - lowerZ) × ratio
END FUNCTION
```

### Step 7: Calculate Coefficient of Variation

```pseudocode
FUNCTION calculateCoefficientOfVariation(expectedValue, standardError):
  IF expectedValue > 0:
    coefficientOfVariation = standardError / expectedValue
  ELSE:
    coefficientOfVariation = INFINITY
  
  RETURN coefficientOfVariation
END FUNCTION
```

**Purpose:** Measures relative variance after accounting for sample size. Uses standard error (not population standard deviation) to show relative variance of the mean over n trades. High CV (> 2.0) indicates high variance relative to the mean.

### Step 8: Calculate Lower Bound of Confidence Interval

```pseudocode
FUNCTION calculateLowerBound(expectedValue, zScore, standardError, numberOfTrades):
  // Calculate lower bound using standard error
  // Formula: μ - z × (σ / √n)
  // This accounts for the sampling distribution of the mean over n trades
  lowerBoundExpectedValue = expectedValue - (zScore × standardError)
  
  // With a large number of trades, the standard error is small enough that
  // this approach works correctly even with high variance.
  // No percentage-based fallback is needed.
  
  IF lowerBoundExpectedValue < 0:
    WARN "Lower bound is negative. Consider increasing numberOfTrades."
  
  RETURN lowerBoundExpectedValue
END FUNCTION
```

**Key Difference:**
- **Incorrect (single trade)**: `μ - z × σ` - uses population standard deviation
- **Correct (multiple trades)**: `μ - z × (σ / √n)` - uses standard error of the mean

The standard error decreases with more trades, making the confidence interval tighter and more accurate for large sample sizes.

**Why No Fallback is Needed:**

With a large number of trades (e.g., n=100), the standard error `σ/√n` is much smaller than the population standard deviation `σ`:

- **Population std dev**: σ = 13.57
- **Standard error (n=100)**: σ/√100 = 13.57/10 = 1.357 (10× smaller!)
- **Lower bound**: 2.22 - (1.28 × 1.357) = 0.48 (positive)

Even with very high variance, the standard error approach works correctly because:
1. Standard error decreases proportionally to 1/√n
2. With n=100, standard error is 10× smaller
3. With n=10,000, standard error is 100× smaller
4. This ensures the lower bound remains positive and economically meaningful

### Step 9: Calculate Final Threshold

```pseudocode
FUNCTION calculateFinalThreshold(lowerBoundExpectedValue):
  // Threshold is the maximum input value where:
  // lower_bound_EV > 3 × threshold
  // Solving: threshold = lower_bound_EV / 3
  
  rawThreshold = lowerBoundExpectedValue / 3
  
  // Ensure threshold is non-negative
  threshold = MAX(0, rawThreshold)
  
  RETURN threshold
END FUNCTION
```

## Complete Algorithm

```pseudocode
FUNCTION calculateThreshold(scarabs, confidencePercentile = 0.9, numberOfTrades = 10000):
  
  // Step 1: Filter valid scarabs
  validScarabs = FILTER scarabs WHERE hasDropWeight() AND hasPriceData()
  IF validScarabs.length == 0: THROW ERROR
  
  // Step 2: Calculate total weight
  totalWeight = SUM(validScarabs.dropWeight)
  IF totalWeight <= 0: THROW ERROR
  
  // Step 3: Calculate expected value
  expectedValue = 0
  FOR EACH scarab IN validScarabs:
    probability = scarab.dropWeight / totalWeight
    expectedValue = expectedValue + (probability × scarab.chaosValue)
  
  // Step 4: Calculate variance
  variance = 0
  FOR EACH scarab IN validScarabs:
    probability = scarab.dropWeight / totalWeight
    diff = scarab.chaosValue - expectedValue
    variance = variance + (probability × diff × diff)
  
  // Step 5: Calculate standard deviation and standard error
  populationStandardDeviation = SQRT(variance)
  standardError = populationStandardDeviation / SQRT(numberOfTrades)
  
  // Step 6: Get z-score
  zScore = getZScore(confidencePercentile)
  
  // Step 7: Calculate coefficient of variation (using standard error)
  coefficientOfVariation = standardError / expectedValue
  
  // Step 8: Calculate lower bound using standard error
  // Uses sampling distribution: X̄ ~ N(μ, σ²/n)
  // With large n, standard error is small enough that this works even with high variance
  lowerBoundExpectedValue = expectedValue - (zScore × standardError)
  
  // Step 9: Validate lower bound (should be positive with sufficient trades)
  IF lowerBoundExpectedValue < 0:
    WARN "Lower bound negative. Consider increasing numberOfTrades."
  
  // Step 10: Calculate final threshold
  threshold = MAX(0, lowerBoundExpectedValue / 3)
  
  RETURN ExpectedValueThreshold(
    value: threshold,
    totalWeight: totalWeight,
    scarabCount: validScarabs.length,
    expectedValue: expectedValue,
    variance: variance,
    standardDeviation: populationStandardDeviation,
    confidencePercentile: confidencePercentile,
    numberOfTrades: numberOfTrades,
    standardError: standardError
  )
END FUNCTION
```

## Example Calculation

### Input Data
```
Scarab A: dropWeight = 100, chaosValue = 1.0
Scarab B: dropWeight = 200, chaosValue = 2.0
Scarab C: dropWeight = 300, chaosValue = 3.0
Confidence: 90% (0.9)
```

### Step-by-Step Calculation

```
Step 1: Total Weight
  totalWeight = 100 + 200 + 300 = 600

Step 2: Expected Value
  probability_A = 100/600 = 0.167
  probability_B = 200/600 = 0.333
  probability_C = 300/600 = 0.500
  
  expectedValue = (0.167 × 1.0) + (0.333 × 2.0) + (0.500 × 3.0)
                = 0.167 + 0.666 + 1.500
                = 2.333

Step 3: Variance
  diff_A = 1.0 - 2.333 = -1.333
  diff_B = 2.0 - 2.333 = -0.333
  diff_C = 3.0 - 2.333 = 0.667
  
  variance = (0.167 × (-1.333)²) + (0.333 × (-0.333)²) + (0.500 × 0.667²)
           = (0.167 × 1.777) + (0.333 × 0.111) + (0.500 × 0.445)
           = 0.296 + 0.037 + 0.222
           = 0.555

Step 4: Standard Deviation and Standard Error
  populationStandardDeviation = SQRT(0.555) = 0.745
  numberOfTrades = 10000 (default)
  standardError = 0.745 / SQRT(10000) = 0.745 / 100 = 0.00745

Step 5: Z-Score (90% confidence)
  zScore = 1.28155

Step 6: Coefficient of Variation (using standard error)
  coefficientOfVariation = 0.00745 / 2.333 = 0.0032
  (CV < 2.0, so standard z-score approach is used)

Step 7: Lower Bound (using standard error)
  lowerBoundExpectedValue = 2.333 - (1.28155 × 0.00745)
                          = 2.333 - 0.00955
                          = 2.3235

Step 8: Final Threshold
  threshold = 2.3235 / 3 = 0.775 chaos
```

**Note:** Using standard error instead of population standard deviation results in a much tighter confidence interval and **higher threshold**, which is more appropriate for multiple trades.

**Comparison:**
- **Single trade (n=1)**: Uses σ → threshold = 0.459 chaos
- **100 trades (n=100)**: Uses σ/10 → threshold = 0.746 chaos (62% higher!)
- **10,000 trades (n=10000)**: Uses σ/100 → threshold = 0.775 chaos (69% higher!)

This demonstrates that **more trades → higher threshold** because variance decreases with sample size.
```

## High Variance Example

### Input Data
```
Expected Value: 2.22 chaos
Population Standard Deviation: 13.57 chaos
Coefficient of Variation (population): 6.11 (very high!)
Confidence: 90% (0.9)
Number of Trades: 10000 (default)
```

### Calculation

```
Step 1: Calculate Standard Error
  numberOfTrades = 10000
  standardError = 13.57 / SQRT(10000)
                 = 13.57 / 100
                 = 0.1357 chaos
  
  Note: Standard error is 100× smaller than population std dev!

Step 2: Calculate Lower Bound Using Standard Error
  zScore = 1.28155
  lowerBoundExpectedValue = 2.22 - (1.28155 × 0.1357)
                          = 2.22 - 0.174
                          = 2.046 chaos (POSITIVE - works correctly!)

Step 3: Final Threshold
  threshold = 2.046 / 3 = 0.682 chaos
```

**Key Insight:** Even with very high variance (CV = 6.11), using standard error with n=10000 trades results in a positive, economically meaningful threshold. **No fallback is needed** because the standard error approach works correctly with sufficient trades.

**Comparison:**
- **Single trade (n=1)**: Uses σ = 13.57 → lower bound = -15.17 (negative, doesn't work)
- **100 trades (n=100)**: Uses σ/10 = 1.357 → lower bound = 0.48 (positive, works!)
- **10,000 trades (n=10,000)**: Uses σ/100 = 0.1357 → lower bound = 2.05 (even better!)

## Interpretation

### Threshold Meaning

The calculated threshold represents the **maximum scarab price** at which vendoring three scarabs using the 3-to-1 recipe is profitable with the specified confidence level.

- **Scarabs priced below the threshold** are marked as "profitable"
- **Scarabs priced at or above the threshold** are marked as "not profitable"

### Confidence Level Impact

- **Lower confidence (80%)**: Higher threshold, less conservative, more scarabs marked as profitable
- **Higher confidence (99%)**: Lower threshold, more conservative, fewer scarabs marked as profitable

### High Variance Handling

With a large number of trades (e.g., n=10000), the standard error approach works correctly even with very high variance:

1. **Standard error decreases**: σ/√n is much smaller than σ
2. **Positive thresholds**: Lower bound remains positive even with high variance
3. **No fallback needed**: The statistical approach is sound for large n

**Example:** With σ=13.57 and n=10000:
- Standard error = 13.57/100 = 0.1357 (100× smaller)
- Lower bound = 2.22 - (1.28 × 0.1357) = 2.05 (positive)

If the lower bound is negative, it indicates `numberOfTrades` is too small for the variance level. The solution is to increase `numberOfTrades`, not use a fallback method.

## Mathematical Foundation

The calculation is based on:

1. **Expected Value Theory**: Weighted average of possible outcomes
2. **Variance Analysis**: Measures uncertainty in outcomes
3. **Sampling Distribution of the Mean**: Accounts for multiple trades
   - Single trade: X ~ N(μ, σ²)
   - n trades mean: X̄ ~ N(μ, σ²/n)
   - Standard error: SE = σ / √n
4. **Confidence Intervals**: Statistical bounds using standard error
5. **Law of Large Numbers**: Ensures accuracy improves with more trades

### Why Standard Error Matters

When considering multiple trades, we use the **sampling distribution of the mean**, not the population distribution:

- **Population standard deviation (σ)**: Variability of a single trade
- **Standard error (σ/√n)**: Variability of the mean over n trades

As the number of trades increases:
- Standard error decreases (by factor of √n)
- Confidence interval becomes tighter
- Threshold becomes more accurate and typically higher

### The 3-to-1 Vendor Recipe

- **Input**: 3 scarabs (cost = 3 × scarab_price)
- **Output**: 1 random scarab (expected value = calculated expected value)
- **Profitability**: output > input → expected_value > 3 × threshold
- **Multiple trades**: Over n trades, the mean output converges to expected value with decreasing variance

