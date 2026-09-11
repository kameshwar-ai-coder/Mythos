import os
import pandas as pd
import numpy as np
import joblib

from xgboost import XGBRegressor

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


# ============================================================
# CONFIGURATION
# ============================================================

DATA_PATH = "E:\Mythos\SIH26006_Freight_Model\SIH26006_Freight_Model\data\market_freight_rate_dataset_50000_2015_2025.csv"

MODEL_DIR = "models"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "freight_rate_forecasting_model.pkl"
)


# ============================================================
# CREATE MODEL DIRECTORY
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print(
    f"Dataset loaded: {df.shape}"
)


# ============================================================
# CHECK COLUMNS
# ============================================================

required_columns = [
    "Date",
    "Market_Freight_Rate_USD_per_Tonne"
]

for column in required_columns:

    if column not in df.columns:

        print(
            f"\nERROR: Missing column: {column}"
        )

        raise SystemExit


# ============================================================
# CONVERT DATE
# ============================================================

df["Date"] = pd.to_datetime(
    df["Date"]
)


# ============================================================
# SORT BY DATE
# ============================================================

df = df.sort_values(
    "Date"
).reset_index(
    drop=True
)


# ============================================================
# CHECK MISSING VALUES
# ============================================================

print("\nMissing values:")

print(
    df.isnull().sum()
)


# ============================================================
# REMOVE MISSING VALUES
# ============================================================

df = df.dropna().copy()


# ============================================================
# REMOVE DUPLICATES
# ============================================================

df = df.drop_duplicates().copy()


print(
    f"\nAfter cleaning: {df.shape}"
)


# ============================================================
# TARGET
# ============================================================

target = "Market_Freight_Rate_USD_per_Tonne"


# ============================================================
# DATE FEATURES
# ============================================================

df["year"] = df["Date"].dt.year

df["month"] = df["Date"].dt.month

df["day"] = df["Date"].dt.day

df["day_of_week"] = df["Date"].dt.dayofweek

df["day_of_year"] = df["Date"].dt.dayofyear


# ============================================================
# LAG FEATURES
# ============================================================

df["lag_1"] = df[target].shift(1)

df["lag_3"] = df[target].shift(3)

df["lag_7"] = df[target].shift(7)

df["lag_14"] = df[target].shift(14)

df["lag_30"] = df[target].shift(30)


# ============================================================
# ROLLING FEATURES
# ============================================================

df["rolling_mean_7"] = (
    df[target]
    .shift(1)
    .rolling(7)
    .mean()
)

df["rolling_mean_14"] = (
    df[target]
    .shift(1)
    .rolling(14)
    .mean()
)

df["rolling_mean_30"] = (
    df[target]
    .shift(1)
    .rolling(30)
    .mean()
)

df["rolling_std_7"] = (
    df[target]
    .shift(1)
    .rolling(7)
    .std()
)

df["rolling_std_30"] = (
    df[target]
    .shift(1)
    .rolling(30)
    .std()
)


# ============================================================
# REMOVE ROWS CREATED BY LAGS
# ============================================================

df = df.dropna().reset_index(
    drop=True
)


print(
    f"\nDataset after feature engineering: {df.shape}"
)


# ============================================================
# FEATURES
# ============================================================

features = [

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
# CHRONOLOGICAL TRAIN / TEST SPLIT
# ============================================================

print(
    "\n=========================================="
)

print(
    "CHRONOLOGICAL TRAIN / TEST SPLIT"
)

print(
    "=========================================="
)


train_size = int(
    len(df) * 0.80
)


train = df.iloc[
    :train_size
].copy()


test = df.iloc[
    train_size:
].copy()


print(
    f"\nTraining records: {len(train)}"
)

print(
    f"Testing records: {len(test)}"
)


print(
    f"\nTraining period:"
)

print(
    train["Date"].min(),
    "to",
    train["Date"].max()
)


print(
    f"\nTesting period:"
)

print(
    test["Date"].min(),
    "to",
    test["Date"].max()
)


# ============================================================
# X / Y
# ============================================================

X_train = train[features]

y_train = train[target]

X_test = test[features]

y_test = test[target]


# ============================================================
# CREATE XGBOOST REGRESSOR
# ============================================================

model = XGBRegressor(

    n_estimators=500,

    max_depth=6,

    learning_rate=0.05,

    subsample=0.8,

    colsample_bytree=0.8,

    objective="reg:squarederror",

    random_state=42,

    n_jobs=-1
)


# ============================================================
# TRAIN MODEL
# ============================================================

print(
    "\n=========================================="
)

print(
    "TRAINING FREIGHT FORECASTING MODEL"
)

print(
    "=========================================="
)

print(
    "\nTraining started..."
)


model.fit(
    X_train,
    y_train
)


print(
    "Training completed!"
)


# ============================================================
# PREDICT TEST DATA
# ============================================================

print(
    "\nMaking predictions..."
)


y_pred = model.predict(
    X_test
)


# ============================================================
# METRICS
# ============================================================

mae = mean_absolute_error(
    y_test,
    y_pred
)


rmse = np.sqrt(
    mean_squared_error(
        y_test,
        y_pred
    )
)


r2 = r2_score(
    y_test,
    y_pred
)


# ============================================================
# MAPE
# ============================================================

mape = np.mean(
    np.abs(
        (y_test - y_pred)
        / y_test
    )
) * 100


# ============================================================
# DISPLAY RESULTS
# ============================================================

print(
    "\n=========================================="
)

print(
    "MODEL PERFORMANCE"
)

print(
    "=========================================="
)


print(
    f"\nMAE  : ${mae:.4f} / tonne"
)

print(
    f"RMSE : ${rmse:.4f} / tonne"
)

print(
    f"R²   : {r2:.4f}"
)

print(
    f"MAPE : {mape:.2f}%"
)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    model,
    MODEL_PATH
)


# ============================================================
# FINAL OUTPUT
# ============================================================

print(
    "\n=========================================="
)

print(
    "TRAINING COMPLETED SUCCESSFULLY"
)

print(
    "=========================================="
)


print(
    f"\nModel saved at:"
)

print(
    MODEL_PATH
)


print(
    "\nDone!"
)