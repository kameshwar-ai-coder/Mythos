import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

from xgboost import XGBClassifier


# ============================================================
# CONFIGURATION
# ============================================================

DATA_PATH = "data/cargo_vessel_dataset_50000.csv"

MODEL_DIR = "models"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "vessel_recommendation_model.pkl"
)

ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "vessel_label_encoder.pkl"
)


# ============================================================
# CREATE MODEL DIRECTORY
# ============================================================

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print(f"Dataset loaded: {df.shape}")


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required_columns = [
    "cargo_category",
    "cargo_type",
    "vessel_type",
    "min_dwt",
    "max_dwt",
    "draft",
    "loa",
    "beam"
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    print("\nERROR: Missing columns:")
    print(missing_columns)

    raise SystemExit


# ============================================================
# DATA CLEANING
# ============================================================

print("\nChecking missing values...")

print(df.isnull().sum())

df = df.dropna().drop_duplicates().copy()

print(f"\nAfter cleaning: {df.shape}")


# ============================================================
# INPUT FEATURES
# ============================================================

X = df[
    [
        "cargo_category",
        "cargo_type",
        "min_dwt",
        "max_dwt",
        "draft",
        "loa",
        "beam"
    ]
]


# ============================================================
# TARGET
# ============================================================

y = df["vessel_type"]


# ============================================================
# ENCODE TARGET
# ============================================================

label_encoder = LabelEncoder()

y_encoded = label_encoder.fit_transform(y)


print("\n==========================================")
print("VESSEL CLASS MAPPING")
print("==========================================")

for number, vessel in enumerate(label_encoder.classes_):

    print(
        f"{number} -> {vessel}"
    )


# ============================================================
# FEATURES
# ============================================================

categorical_features = [
    "cargo_category",
    "cargo_type"
]

numerical_features = [
    "min_dwt",
    "max_dwt",
    "draft",
    "loa",
    "beam"
]


# ============================================================
# PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(

    transformers=[

        (
            "categorical",

            OneHotEncoder(
                handle_unknown="ignore"
            ),

            categorical_features
        )
    ],

    remainder="passthrough"
)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

print("\n==========================================")
print("TRAIN / TEST SPLIT")
print("==========================================")

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y_encoded,

    test_size=0.20,

    random_state=42,

    stratify=y_encoded
)


print(
    f"Training records: {len(X_train)}"
)

print(
    f"Testing records: {len(X_test)}"
)


# ============================================================
# XGBOOST MODEL
# ============================================================

model = XGBClassifier(

    n_estimators=300,

    max_depth=6,

    learning_rate=0.05,

    subsample=0.8,

    colsample_bytree=0.8,

    objective="multi:softprob",

    eval_metric="mlogloss",

    random_state=42,

    n_jobs=-1
)


# ============================================================
# PIPELINE
# ============================================================

pipeline = Pipeline(

    steps=[

        (
            "preprocessor",
            preprocessor
        ),

        (
            "model",
            model
        )
    ]
)


# ============================================================
# TRAIN
# ============================================================

print("\n==========================================")
print("TRAINING MODEL")
print("==========================================")

print("Training started...")

pipeline.fit(
    X_train,
    y_train
)

print("Training completed!")


# ============================================================
# PREDICTION
# ============================================================

print("\nMaking predictions...")

y_pred = pipeline.predict(
    X_test
)


# ============================================================
# ACCURACY
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)


print("\n==========================================")
print("MODEL PERFORMANCE")
print("==========================================")

print(
    f"\nAccuracy: {accuracy * 100:.2f}%"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

y_test_names = label_encoder.inverse_transform(
    y_test
)

y_pred_names = label_encoder.inverse_transform(
    y_pred
)


print("\n==========================================")
print("CLASSIFICATION REPORT")
print("==========================================")

print(

    classification_report(

        y_test_names,

        y_pred_names,

        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n==========================================")
print("CONFUSION MATRIX")
print("==========================================")

cm = confusion_matrix(

    y_test_names,

    y_pred_names,

    labels=label_encoder.classes_
)


cm_df = pd.DataFrame(

    cm,

    index=label_encoder.classes_,

    columns=label_encoder.classes_
)


print(cm_df)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(

    pipeline,

    MODEL_PATH
)


# ============================================================
# SAVE LABEL ENCODER
# ============================================================

joblib.dump(

    label_encoder,

    ENCODER_PATH
)


# ============================================================
# FINAL RESULT
# ============================================================

print("\n==========================================")
print("TRAINING COMPLETED")
print("==========================================")

print(
    f"\nModel saved:\n{MODEL_PATH}"
)

print(
    f"\nEncoder saved:\n{ENCODER_PATH}"
)

print(
    f"\nDataset: {len(df)} records"
)

print(
    f"Training: {len(X_train)} records"
)

print(
    f"Testing: {len(X_test)} records"
)

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)

print("\nVessel classes:")

for vessel in label_encoder.classes_:

    print(
        f"- {vessel}"
    )

print("\nDone!")