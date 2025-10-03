from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Subscription Tracker AI Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class Subscription(BaseModel):
    name: str
    price: float
    billing_date: str
    category: str = "Other"
    status: str = "active"

class PredictSpendingRequest(BaseModel):
    subscriptions: List[Subscription]
    historical_data: List[Dict[str, Any]] = []
    months_ahead: int = 3

class BudgetRecommendationRequest(BaseModel):
    subscriptions: List[Subscription]
    current_budget: float = 0
    income: float = 0
    expenses: List[Dict[str, float]] = []

class ReminderSuggestionsRequest(BaseModel):
    subscriptions: List[Subscription]
    user_preferences: Dict[str, Any] = {}

class PredictSpendingResponse(BaseModel):
    predictions: List[Dict[str, float]]
    total_predicted: float
    confidence_score: float
    insights: List[str]

class BudgetRecommendationResponse(BaseModel):
    recommended_budget: float
    category_allocations: Dict[str, float]
    savings_potential: float
    recommendations: List[str]

class ReminderSuggestionsResponse(BaseModel):
    reminders: List[Dict[str, Any]]
    optimization_tips: List[str]

@app.get("/")
async def root():
    return {"message": "Subscription Tracker AI Service", "status": "running"}

@app.post("/ai/predict-spending", response_model=PredictSpendingResponse)
async def predict_spending(request: PredictSpendingRequest):
    """
    Predict future spending based on current subscriptions and historical data
    """
    try:
        predictions = []
        total_monthly = sum(sub.price for sub in request.subscriptions if sub.status == "active")
        
        # Generate predictions for the next N months
        for i in range(request.months_ahead):
            future_date = datetime.now() + timedelta(days=30 * (i + 1))
            
            # Add some variance based on historical patterns (mock AI logic)
            variance = np.random.uniform(0.95, 1.1)  # ±10% variance
            predicted_amount = total_monthly * variance
            
            predictions.append({
                "month": future_date.strftime("%Y-%m"),
                "predicted_amount": round(predicted_amount, 2),
                "base_amount": total_monthly,
                "variance_factor": round(variance, 3)
            })
        
        total_predicted = sum(p["predicted_amount"] for p in predictions)
        
        # Generate insights
        insights = []
        if total_monthly > 200:
            insights.append("Your subscription spending is above average. Consider reviewing unused services.")
        
        if len(request.subscriptions) > 10:
            insights.append("You have many active subscriptions. Bundle opportunities may exist.")
        
        category_counts = {}
        for sub in request.subscriptions:
            category_counts[sub.category] = category_counts.get(sub.category, 0) + 1
        
        if category_counts.get("Entertainment", 0) > 3:
            insights.append("Multiple entertainment subscriptions detected. Consider consolidating.")
        
        # Calculate confidence score based on data quality
        confidence = 0.85 if len(request.historical_data) > 6 else 0.7
        
        return PredictSpendingResponse(
            predictions=predictions,
            total_predicted=round(total_predicted, 2),
            confidence_score=confidence,
            insights=insights
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/ai/budget-recommendation", response_model=BudgetRecommendationResponse)
async def budget_recommendation(request: BudgetRecommendationRequest):
    """
    Generate AI-driven budget recommendations based on subscriptions and financial data
    """
    try:
        total_subscription_cost = sum(sub.price for sub in request.subscriptions if sub.status == "active")
        
        # Category-based analysis
        category_spending = {}
        for sub in request.subscriptions:
            if sub.status == "active":
                category_spending[sub.category] = category_spending.get(sub.category, 0) + sub.price
        
        # Recommended budget should be 110-120% of current spending for buffer
        recommended_budget = total_subscription_cost * 1.15
        
        # If income is provided, cap at 20% of income
        if request.income > 0:
            max_budget = request.income * 0.2
            recommended_budget = min(recommended_budget, max_budget)
        
        # Calculate savings potential
        current_budget = request.current_budget or total_subscription_cost
        savings_potential = max(0, current_budget - total_subscription_cost)
        
        # Generate recommendations
        recommendations = []
        
        if total_subscription_cost > request.income * 0.15 and request.income > 0:
            recommendations.append("Subscription costs exceed 15% of income. Consider reducing services.")
        
        if savings_potential > 50:
            recommendations.append(f"You could save ${savings_potential:.2f} monthly by optimizing subscriptions.")
        
        # Find most expensive category
        if category_spending:
            max_category = max(category_spending.items(), key=lambda x: x[1])
            if max_category[1] > total_subscription_cost * 0.4:
                recommendations.append(f"Consider reducing {max_category[0]} subscriptions - they're {(max_category[1]/total_subscription_cost*100):.1f}% of your total.")
        
        # Suggest bundling for entertainment
        entertainment_cost = category_spending.get("Entertainment", 0)
        if entertainment_cost > 50:
            recommendations.append("Look into bundled entertainment packages to reduce costs.")
        
        if not recommendations:
            recommendations.append("Your subscription budget looks well-balanced!")
        
        return BudgetRecommendationResponse(
            recommended_budget=round(recommended_budget, 2),
            category_allocations=category_spending,
            savings_potential=round(savings_potential, 2),
            recommendations=recommendations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget recommendation failed: {str(e)}")

@app.post("/ai/reminder-suggestions", response_model=ReminderSuggestionsResponse)
async def reminder_suggestions(request: ReminderSuggestionsRequest):
    """
    Generate smart reminder suggestions based on subscription patterns
    """
    try:
        reminders = []
        optimization_tips = []
        
        # Analyze billing patterns
        for sub in request.subscriptions:
            if sub.status == "active":
                billing_date = datetime.strptime(sub.billing_date, "%Y-%m-%d")
                days_until_billing = (billing_date - datetime.now()).days
                
                # Upcoming renewals (next 7 days)
                if 0 <= days_until_billing <= 7:
                    reminders.append({
                        "type": "upcoming_renewal",
                        "subscription": sub.name,
                        "date": sub.billing_date,
                        "amount": sub.price,
                        "message": f"{sub.name} renews in {days_until_billing} days for ${sub.price}",
                        "priority": "high" if sub.price > 50 else "medium"
                    })
                
                # Overdue payments
                if days_until_billing < 0:
                    reminders.append({
                        "type": "overdue",
                        "subscription": sub.name,
                        "date": sub.billing_date,
                        "amount": sub.price,
                        "message": f"{sub.name} payment was due {abs(days_until_billing)} days ago",
                        "priority": "urgent"
                    })
        
        # Generate optimization tips
        expensive_subs = [sub for sub in request.subscriptions if sub.price > 20 and sub.status == "active"]
        if expensive_subs:
            optimization_tips.append("Review your most expensive subscriptions for potential downgrades or cancellations.")
        
        # Check for duplicate categories
        categories = {}
        for sub in request.subscriptions:
            if sub.status == "active":
                if sub.category in categories:
                    categories[sub.category].append(sub)
                else:
                    categories[sub.category] = [sub]
        
        for category, subs in categories.items():
            if len(subs) > 2 and category != "Other":
                optimization_tips.append(f"You have {len(subs)} {category} subscriptions. Consider consolidating.")
        
        # Annual vs monthly billing optimization
        annual_savings_tip = "Consider switching to annual billing for frequently used services to save 10-20%."
        optimization_tips.append(annual_savings_tip)
        
        # Free trial reminders
        trial_reminder = {
            "type": "free_trial_ending",
            "message": "Remember to cancel free trials before they convert to paid subscriptions",
            "priority": "medium"
        }
        reminders.append(trial_reminder)
        
        return ReminderSuggestionsResponse(
            reminders=reminders,
            optimization_tips=optimization_tips
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reminder suggestions failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)