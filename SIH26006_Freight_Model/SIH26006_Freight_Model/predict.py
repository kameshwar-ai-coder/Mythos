# ============================================================
# SIH26006 - FREIGHT RATE FORECASTING
# 360-DAY FREIGHT FORECAST
# ============================================================

import os
import warnings
import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


# ============================================================
# 1. CONFIGURATION
# ============================================================

DATA_PATH = r"E:\Mythos\SIH26006_Freight_Model\SIH26006_Freight_Model\data\market_freight_rate_dataset_50000_2015_2025.csv"

MODEL_PATH = r"E:\Mythos\SIH26006_Freight_Model\SIH26006_Freight_Model\models\freight_rate_forecasting_model.pkl"

OUTPUT_PATH = r"E:\Mythos\SIH26006_Freight_Model\SIH26006_Freight_Model\forecast_360_days.csv"

FORECAST_DAYS = 360

TARGET_COLUMN = "Market_Freight_Rate_USD_per_Tonne"

DATE_COLUMN = "Date"


# ============================================================
# 2. MODEL FEATURES
# ============================================================

FEATURES = [
    "year",
    "month",
    "day",
    "day_of_week",
    "day_of_year",

    "lag_1",
    "lag_3",
    "lag_7",
    "lag_14",
    "lag_30",

    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_mean_30",

    "rolling_std_7",
    "rolling_std_30"
]


# ============================================================
# 3. LOAD DATASET
# ============================================================

print("=" * 70)
print("SIH26006 - INTELLIGENT FREIGHT FORECASTING MODEL")
print("360-DAY FREIGHT RATE FORECAST")
print("=" * 70)

print("\nLoading dataset...")

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"\nDataset not found:\n{DATA_PATH}"
    )

df = pd.read_csv(DATA_PATH)

print(f"Dataset loaded successfully: {len(df):,} records")


# ============================================================
# 4. CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    DATE_COLUMN,
    TARGET_COLUMN
]

for column in required_columns:
    if column not in df.columns:
        raise ValueError(
            f"\nRequired column missing from dataset: {column}"
        )


# ============================================================
# 5. CONVERT DATE COLUMN
# ============================================================

df[DATE_COLUMN] = pd.to_datetime(
    df[DATE_COLUMN],
    errors="coerce"
)

df = df.dropna(
    subset=[DATE_COLUMN, TARGET_COLUMN]
)


# ============================================================
# 6. CONVERT FREIGHT RATE TO NUMERIC
# ============================================================

df[TARGET_COLUMN] = pd.to_numeric(
    df[TARGET_COLUMN],
    errors="coerce"
)

df = df.dropna(
    subset=[TARGET_COLUMN]
)


# ============================================================
# 7. SORT BY DATE
# ============================================================

df = df.sort_values(
    DATE_COLUMN
).reset_index(drop=True)


# ============================================================
# 8. DAILY AGGREGATION
# ============================================================
#
# Original dataset contains intraday timestamps.
# Since the forecasting horizon is expressed in calendar days,
# we convert the data to one freight rate per day.
#
# Daily freight rate = mean of all observations on that day.
# ============================================================

df["Date_Day"] = df[DATE_COLUMN].dt.normalize()

daily_df = (
    df.groupby("Date_Day")[TARGET_COLUMN]
    .mean()
    .reset_index()
)

daily_df.columns = [
    "Date",
    TARGET_COLUMN
]

daily_df = daily_df.sort_values(
    "Date"
).reset_index(drop=True)


print(
    f"Daily historical records available: {len(daily_df):,}"
)


# ============================================================
# 9. LOAD TRAINED MODEL
# ============================================================

print("\nLoading trained XGBoost model...")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"\nModel not found:\n{MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)

print("XGBoost model loaded successfully.")


# ============================================================
# 10. FEATURE ENGINEERING FUNCTION
# ============================================================

def create_features(data):
    """
    Create the exact feature structure expected by the model.
    """

    temp = data.copy()

    temp["Date"] = pd.to_datetime(temp["Date"])

    # Calendar features
    temp["year"] = temp["Date"].dt.year
    temp["month"] = temp["Date"].dt.month
    temp["day"] = temp["Date"].dt.day
    temp["day_of_week"] = temp["Date"].dt.dayofweek
    temp["day_of_year"] = temp["Date"].dt.dayofyear

    # Lag features
    temp["lag_1"] = temp[TARGET_COLUMN].shift(1)
    temp["lag_3"] = temp[TARGET_COLUMN].shift(3)
    temp["lag_7"] = temp[TARGET_COLUMN].shift(7)
    temp["lag_14"] = temp[TARGET_COLUMN].shift(14)
    temp["lag_30"] = temp[TARGET_COLUMN].shift(30)

    # Rolling mean
    temp["rolling_mean_7"] = (
        temp[TARGET_COLUMN]
        .rolling(window=7)
        .mean()
    )

    temp["rolling_mean_14"] = (
        temp[TARGET_COLUMN]
        .rolling(window=14)
        .mean()
    )

    temp["rolling_mean_30"] = (
        temp[TARGET_COLUMN]
        .rolling(window=30)
        .mean()
    )

    # Rolling standard deviation
    temp["rolling_std_7"] = (
        temp[TARGET_COLUMN]
        .rolling(window=7)
        .std()
    )

    temp["rolling_std_30"] = (
        temp[TARGET_COLUMN]
        .rolling(window=30)
        .std()
    )

    return temp


# ============================================================
# 11. PREPARE HISTORICAL DATA
# ============================================================

historical = daily_df.copy()

historical = create_features(
    historical
)

historical = historical.dropna(
    subset=FEATURES
).reset_index(drop=True)


# ============================================================
# 12. LATEST AVAILABLE INFORMATION
# ============================================================

latest_date = daily_df["Date"].max()

latest_rate = daily_df.loc[
    daily_df["Date"] == latest_date,
    TARGET_COLUMN
].iloc[0]


# ============================================================
# 13. RECENT AVERAGES
# ============================================================

last_7_days = daily_df.tail(7)

last_30_days = daily_df.tail(30)

average_7 = last_7_days[
    TARGET_COLUMN
].mean()

average_30 = last_30_days[
    TARGET_COLUMN
].mean()


# ============================================================
# 14. DISPLAY CURRENT MARKET INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("CURRENT MARKET INFORMATION")
print("=" * 70)

print(
    f"Latest Available Date : "
    f"{latest_date.strftime('%Y-%m-%d')}"
)

print(
    f"Current Freight Rate  : "
    f"${latest_rate:.2f} / tonne"
)

print(
    f"7-Day Average         : "
    f"${average_7:.2f} / tonne"
)

print(
    f"30-Day Average        : "
    f"${average_30:.2f} / tonne"
)


# ============================================================
# 15. RECURSIVE 360-DAY FORECAST
# ============================================================

print("\n" + "=" * 70)
print("GENERATING 360-DAY FORECAST")
print("=" * 70)

# We use daily historical data as the starting point.
forecast_history = daily_df.copy()

forecasts = []


for i in range(1, FORECAST_DAYS + 1):

    # --------------------------------------------------------
    # Next forecast date
    # --------------------------------------------------------

    next_date = latest_date + pd.Timedelta(days=i)


    # --------------------------------------------------------
    # Create temporary row
    # --------------------------------------------------------

    new_row = pd.DataFrame({
        "Date": [next_date],
        TARGET_COLUMN: [np.nan]
    })


    # --------------------------------------------------------
    # Append to history
    # --------------------------------------------------------

    temp_history = pd.concat(
        [
            forecast_history,
            new_row
        ],
        ignore_index=True
    )


    # --------------------------------------------------------
    # Create features
    # --------------------------------------------------------

    temp_features = create_features(
        temp_history
    )


    # --------------------------------------------------------
    # Get latest row
    # --------------------------------------------------------

    prediction_row = temp_features.iloc[
        [-1]
    ].copy()


    # --------------------------------------------------------
    # Fill rolling / lag features
    #
    # For the forecast row, the target is NaN.
    # Therefore, lag values are based on previous observations,
    # while rolling statistics are calculated from the historical
    # values before the new prediction.
    # --------------------------------------------------------

    previous_values = forecast_history[
        TARGET_COLUMN
    ].values


    # --------------------------------------------------------
    # Calendar features
    # --------------------------------------------------------

    prediction_row["year"] = next_date.year
    prediction_row["month"] = next_date.month
    prediction_row["day"] = next_date.day
    prediction_row["day_of_week"] = next_date.dayofweek
    prediction_row["day_of_year"] = next_date.dayofyear


    # --------------------------------------------------------
    # Lag features
    # --------------------------------------------------------

    prediction_row["lag_1"] = (
        previous_values[-1]
    )

    prediction_row["lag_3"] = (
        previous_values[-3]
    )

    prediction_row["lag_7"] = (
        previous_values[-7]
    )

    prediction_row["lag_14"] = (
        previous_values[-14]
    )

    prediction_row["lag_30"] = (
        previous_values[-30]
    )


    # --------------------------------------------------------
    # Rolling features
    # --------------------------------------------------------

    prediction_row["rolling_mean_7"] = (
        forecast_history[
            TARGET_COLUMN
        ].tail(7).mean()
    )

    prediction_row["rolling_mean_14"] = (
        forecast_history[
            TARGET_COLUMN
        ].tail(14).mean()
    )

    prediction_row["rolling_mean_30"] = (
        forecast_history[
            TARGET_COLUMN
        ].tail(30).mean()
    )


    # --------------------------------------------------------
    # Rolling standard deviation
    # --------------------------------------------------------

    prediction_row["rolling_std_7"] = (
        forecast_history[
            TARGET_COLUMN
        ].tail(7).std()
    )

    prediction_row["rolling_std_30"] = (
        forecast_history[
            TARGET_COLUMN
        ].tail(30).std()
    )


    # --------------------------------------------------------
    # Prepare X
    # --------------------------------------------------------

    X_future = prediction_row[
        FEATURES
    ]


    # --------------------------------------------------------
    # XGBoost prediction
    # --------------------------------------------------------

    prediction = model.predict(
        X_future
    )


    forecast_rate = float(
        prediction[0]
    )


    # --------------------------------------------------------
    # Prevent impossible negative freight rates
    # --------------------------------------------------------

    forecast_rate = max(
        forecast_rate,
        0
    )


    # --------------------------------------------------------
    # Add forecast result to history
    # --------------------------------------------------------

    forecast_history = pd.concat(
        [
            forecast_history,
            pd.DataFrame({
                "Date": [next_date],
                TARGET_COLUMN: [forecast_rate]
            })
        ],
        ignore_index=True
    )


    # --------------------------------------------------------
    # Store forecast
    # --------------------------------------------------------

    forecasts.append({
        "Date": next_date,
        "Forecast_Rate_USD_per_Tonne": forecast_rate
    })


    # --------------------------------------------------------
    # Progress
    # --------------------------------------------------------

    if i % 30 == 0 or i == FORECAST_DAYS:

        print(
            f"Completed: "
            f"{i} / {FORECAST_DAYS} days"
        )


# ============================================================
# 16. CONVERT FORECAST TO DATAFRAME
# ============================================================

forecast_df = pd.DataFrame(
    forecasts
)


# ============================================================
# 17. FORECAST SUMMARY FUNCTION
# ============================================================

def get_forecast_rate(days):
    """
    Get forecast rate at a specific future horizon.
    """

    return forecast_df.iloc[
        days - 1
    ]["Forecast_Rate_USD_per_Tonne"]


# ============================================================
# 18. CALCULATE FORECAST VALUES
# ============================================================

forecast_7 = get_forecast_rate(7)
forecast_14 = get_forecast_rate(14)
forecast_30 = get_forecast_rate(30)
forecast_90 = get_forecast_rate(90)
forecast_180 = get_forecast_rate(180)
forecast_360 = get_forecast_rate(360)


# ============================================================
# 19. PERCENTAGE CHANGE FUNCTION
# ============================================================

def percentage_change(new_value, old_value):

    if old_value == 0:
        return 0

    return (
        (new_value - old_value)
        / old_value
    ) * 100


# ============================================================
# 20. CALCULATE CHANGES
# ============================================================

change_7 = percentage_change(
    forecast_7,
    latest_rate
)

change_14 = percentage_change(
    forecast_14,
    latest_rate
)

change_30 = percentage_change(
    forecast_30,
    latest_rate
)

change_90 = percentage_change(
    forecast_90,
    latest_rate
)

change_180 = percentage_change(
    forecast_180,
    latest_rate
)

change_360 = percentage_change(
    forecast_360,
    latest_rate
)


# ============================================================
# 21. DISPLAY FORECAST SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FREIGHT RATE FORECAST SUMMARY")
print("=" * 70)

print(
    f"7-Day Forecast:   "
    f"${forecast_7:.2f} / tonne   "
    f"Change: {change_7:+.2f}%"
)

print(
    f"14-Day Forecast:  "
    f"${forecast_14:.2f} / tonne   "
    f"Change: {change_14:+.2f}%"
)

print(
    f"30-Day Forecast:  "
    f"${forecast_30:.2f} / tonne   "
    f"Change: {change_30:+.2f}%"
)

print(
    f"90-Day Forecast:  "
    f"${forecast_90:.2f} / tonne   "
    f"Change: {change_90:+.2f}%"
)

print(
    f"180-Day Forecast: "
    f"${forecast_180:.2f} / tonne   "
    f"Change: {change_180:+.2f}%"
)

print(
    f"360-Day Forecast: "
    f"${forecast_360:.2f} / tonne   "
    f"Change: {change_360:+.2f}%"
)


# ============================================================
# 22. SHORT-TERM TREND
# ============================================================

if forecast_30 > latest_rate * 1.03:

    short_term_trend = "RISING"

elif forecast_30 < latest_rate * 0.97:

    short_term_trend = "FALLING"

else:

    short_term_trend = "STABLE"


# ============================================================
# 23. LONG-TERM TREND
# ============================================================

if forecast_360 > latest_rate * 1.10:

    long_term_trend = "STRONGLY RISING"

elif forecast_360 > latest_rate * 1.03:

    long_term_trend = "RISING"

elif forecast_360 < latest_rate * 0.90:

    long_term_trend = "STRONGLY FALLING"

elif forecast_360 < latest_rate * 0.97:

    long_term_trend = "FALLING"

else:

    long_term_trend = "STABLE"


# ============================================================
# 24. CHARTER / PROCUREMENT RECOMMENDATION
# ============================================================

if forecast_30 < latest_rate * 0.97:

    recommendation = (
        "WAIT - FREIGHT RATES ARE EXPECTED TO DECLINE"
    )

elif forecast_30 > latest_rate * 1.03:

    recommendation = (
        "CONSIDER EARLY CONTRACTING - "
        "FREIGHT RATES ARE EXPECTED TO RISE"
    )

else:

    recommendation = (
        "MONITOR MARKET - "
        "FREIGHT RATES ARE RELATIVELY STABLE"
    )


# ============================================================
# 25. DISPLAY TREND
# ============================================================

print("\n" + "=" * 70)
print("MARKET TREND ANALYSIS")
print("=" * 70)

print(
    f"Short-Term Trend: {short_term_trend}"
)

print(
    f"Long-Term Trend:  {long_term_trend}"
)

print(
    f"Recommendation:   {recommendation}"
)


# ============================================================
# 26. DISPLAY COMPLETE 360-DAY FORECAST
# ============================================================

print("\n" + "=" * 70)
print("360-DAY FORECAST TABLE")
print("=" * 70)

print(
    f"{'Date':<15}"
    f"{'Forecast Rate (USD/Tonne)':>30}"
)

print("-" * 50)


for item in forecasts:

    print(
        f"{item['Date'].strftime('%Y-%m-%d'):<15}"
        f"${item['Forecast_Rate_USD_per_Tonne']:>28.2f}"
    )


# ============================================================
# 27. SAVE FORECAST CSV
# ============================================================

forecast_df.to_csv(
    OUTPUT_PATH,
    index=False
)


# ============================================================
# 28. FINAL OUTPUT
# ============================================================

print("\n" + "=" * 70)
print("FORECAST COMPLETED SUCCESSFULLY")
print("=" * 70)

print(
    f"Forecast Start Date : "
    f"{forecasts[0]['Date'].strftime('%Y-%m-%d')}"
)

print(
    f"Forecast End Date   : "
    f"{forecasts[-1]['Date'].strftime('%Y-%m-%d')}"
)

print(
    f"Total Forecast Days : "
    f"{len(forecasts)}"
)

print(
    f"\nForecast saved to:\n{OUTPUT_PATH}"
)

print("=" * 70)