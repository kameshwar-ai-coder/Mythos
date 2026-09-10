import pandas as pd
import os


# ============================================================
# CONFIGURATION
# ============================================================

DATASET_PATH = r"D:\SIH26006_Vessel_Model\data\vessel_dataset_v2.csv"


# ============================================================
# REQUIRED DATASET COLUMNS
# ============================================================

REQUIRED_COLUMNS = [
    "cargo_category",
    "cargo_type",
    "vessel_type",
    "min_dwt",
    "max_dwt",
    "draft",
    "loa",
    "beam"
]


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(value):
    """
    Cleans text values:
    - Converts to string
    - Removes extra spaces
    - Converts to lowercase
    """

    if pd.isna(value):
        return ""

    return str(value).strip().lower()


# ============================================================
# CARGO CATEGORY NORMALIZATION
# ============================================================

def normalize_category(value):

    value = clean_text(value)

    category_mapping = {
        "dry bulk": "Dry Bulk",
        "drybulk": "Dry Bulk",

        "liquid bulk": "Liquid Bulk",
        "liquidbulk": "Liquid Bulk",

        "gas bulk": "Gas Bulk",
        "gasbulk": "Gas Bulk",
        "bulk gases": "Gas Bulk",
        "bulk gas": "Gas Bulk"
    }

    return category_mapping.get(value, value.title())


# ============================================================
# LOAD DATASET
# ============================================================

def load_dataset():

    print("\nLoading vessel dataset...")

    if not os.path.exists(DATASET_PATH):

        print("\nERROR: Vessel dataset not found.")
        print(f"Expected location:\n{DATASET_PATH}")

        return None

    try:

        df = pd.read_csv(DATASET_PATH)

    except Exception as e:

        print("\nERROR: Could not load vessel dataset.")
        print(f"Details: {e}")

        return None

    # --------------------------------------------------------
    # Check required columns
    # --------------------------------------------------------

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:

        print("\nERROR: Dataset is missing required columns:")

        for column in missing_columns:
            print(f" - {column}")

        return None

    print(
        f"Dataset loaded successfully: {len(df):,} vessel records"
    )

    return df


# ============================================================
# PREPARE DATASET
# ============================================================

def prepare_dataset(df):

    df = df.copy()

    # --------------------------------------------------------
    # Clean categorical columns
    # --------------------------------------------------------

    df["cargo_category"] = df["cargo_category"].apply(
        normalize_category
    )

    df["cargo_type"] = df["cargo_type"].apply(
        lambda x: str(x).strip()
    )

    df["vessel_type"] = df["vessel_type"].apply(
        lambda x: str(x).strip()
    )

    # --------------------------------------------------------
    # Convert vessel specifications to numeric
    # --------------------------------------------------------

    numeric_columns = [
        "min_dwt",
        "max_dwt",
        "draft",
        "loa",
        "beam"
    ]

    for column in numeric_columns:

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    # --------------------------------------------------------
    # Remove rows with invalid vessel specifications
    # --------------------------------------------------------

    df = df.dropna(
        subset=[
            "max_dwt",
            "draft",
            "loa",
            "beam"
        ]
    )

    # --------------------------------------------------------
    # Remove impossible DWT values
    # --------------------------------------------------------

    df = df[df["max_dwt"] > 0]

    return df


# ============================================================
# GET CARGO WEIGHT
# ============================================================

def get_weight():

    while True:

        try:

            value = input(
                "\nEnter cargo weight (tonnes): "
            ).strip()

            weight = float(value)

            # Only reject zero/negative values.
            # There is NO artificial maximum weight.

            if weight <= 0:

                print(
                    "Please enter a cargo weight greater than 0."
                )

                continue

            return weight

        except ValueError:

            print(
                "Invalid weight. Please enter a numeric value."
            )


# ============================================================
# GET CARGO CATEGORY
# ============================================================

def get_cargo_category():

    print("\n## SELECT CARGO CATEGORY\n")

    print("1. Dry Bulk")
    print("2. Liquid Bulk")
    print("3. Gas Bulk")

    category_mapping = {
        "1": "Dry Bulk",
        "2": "Liquid Bulk",
        "3": "Gas Bulk"
    }

    while True:

        choice = input(
            "\nEnter choice (1-3): "
        ).strip()

        if choice in category_mapping:

            return category_mapping[choice]

        print(
            "Invalid choice. Please enter 1, 2, or 3."
        )


# ============================================================
# GET CARGO TYPE
# ============================================================

def get_cargo_type(df, category):

    # --------------------------------------------------------
    # Find cargo types for selected category
    # --------------------------------------------------------

    category_df = df[
        df["cargo_category"].apply(
            normalize_category
        ) == category
    ]

    cargo_types = sorted(
        category_df["cargo_type"]
        .dropna()
        .astype(str)
        .str.strip()
        .unique()
    )

    # --------------------------------------------------------
    # If category has no cargo types
    # --------------------------------------------------------

    if len(cargo_types) == 0:

        print(
            "\nNo specific cargo types were found "
            "for this category."
        )

        while True:

            cargo_type = input(
                "\nEnter cargo type: "
            ).strip()

            if cargo_type:
                return cargo_type

            print(
                "Cargo type cannot be empty."
            )

    # --------------------------------------------------------
    # Display cargo types
    # --------------------------------------------------------

    print("\n## CARGO TYPES\n")

    for index, cargo_type in enumerate(
        cargo_types,
        start=1
    ):

        print(
            f"{index}. {cargo_type}"
        )

    print(
        "\nEnter the number or type the cargo name."
    )

    while True:

        user_input = input(
            "\nEnter cargo type: "
        ).strip()

        # ----------------------------------------------------
        # User selected number
        # ----------------------------------------------------

        if user_input.isdigit():

            number = int(user_input)

            if 1 <= number <= len(cargo_types):

                return cargo_types[number - 1]

            print(
                f"Please enter a number between "
                f"1 and {len(cargo_types)}."
            )

            continue

        # ----------------------------------------------------
        # User typed cargo name
        # ----------------------------------------------------

        for cargo_type in cargo_types:

            if clean_text(cargo_type) == clean_text(
                user_input
            ):

                return cargo_type

        print(
            "Cargo type not found. "
            "Please select from the list."
        )


# ============================================================
# VESSEL RECOMMENDATION ENGINE
# ============================================================

def recommend_vessel(
    df,
    cargo_category,
    cargo_type,
    weight
):

    print("\nAnalyzing vessel dataset...")

    # --------------------------------------------------------
    # STEP 1
    # Filter by cargo category
    # --------------------------------------------------------

    category_matches = df[
        df["cargo_category"].apply(
            normalize_category
        ) == cargo_category
    ].copy()

    # --------------------------------------------------------
    # STEP 2
    # Try exact cargo type match
    # --------------------------------------------------------

    type_matches = category_matches[
        category_matches["cargo_type"].apply(
            clean_text
        ) == clean_text(cargo_type)
    ].copy()

    # --------------------------------------------------------
    # STEP 3
    # Select candidate pool
    #
    # Priority:
    #
    # Exact cargo type
    #       ↓
    # Cargo category
    #       ↓
    # Complete vessel dataset
    # --------------------------------------------------------

    if not type_matches.empty:

        candidates = type_matches

    elif not category_matches.empty:

        candidates = category_matches

    else:

        candidates = df.copy()

    # --------------------------------------------------------
    # STEP 4
    # Calculate DWT difference
    # --------------------------------------------------------

    candidates["weight_difference"] = (
        candidates["max_dwt"] - weight
    ).abs()

    # --------------------------------------------------------
    # STEP 5
    # Determine whether vessel can carry cargo
    #
    # IMPORTANT:
    #
    # This is NOT a hard filter.
    #
    # Vessels capable of carrying the cargo are preferred,
    # but if none exists, the closest vessel is still returned.
    # --------------------------------------------------------

    candidates["can_carry"] = (
        candidates["max_dwt"] >= weight
    )

    # --------------------------------------------------------
    # STEP 6
    # Rank vessels
    #
    # Priority 1:
    # Vessel can carry requested weight
    #
    # Priority 2:
    # DWT closest to requested weight
    # --------------------------------------------------------

    candidates = candidates.sort_values(
        by=[
            "can_carry",
            "weight_difference"
        ],
        ascending=[
            False,
            True
        ]
    )

    # --------------------------------------------------------
    # STEP 7
    # Select best vessel
    # --------------------------------------------------------

    best_vessel = candidates.iloc[0]

    return best_vessel


# ============================================================
# DISPLAY FINAL RESULT
# ============================================================

def display_result(vessel):

    print("\n" + "=" * 55)
    print("BEST VESSEL RECOMMENDATION")
    print("=" * 55)

    print(
        f"\nVessel Type    : "
        f"{vessel['vessel_type']}"
    )

    print(
        f"Maximum DWT    : "
        f"{vessel['max_dwt']:,.2f}"
    )

    print(
        f"Draft          : "
        f"{vessel['draft']:.2f} m"
    )

    print(
        f"LOA            : "
        f"{vessel['loa']:.2f} m"
    )

    print(
        f"Beam           : "
        f"{vessel['beam']:.2f} m"
    )

    print("\n" + "=" * 55)


# ============================================================
# MAIN PROGRAM
# ============================================================

def main():

    print("\n" + "=" * 55)
    print("INTELLIGENT VESSEL RECOMMENDATION SYSTEM")
    print("=" * 55)

    # --------------------------------------------------------
    # Load dataset
    # --------------------------------------------------------

    df = load_dataset()

    if df is None:
        return

    # --------------------------------------------------------
    # Prepare dataset
    # --------------------------------------------------------

    df = prepare_dataset(df)

    if df.empty:

        print(
            "\nERROR: No valid vessel records found."
        )

        return

    # --------------------------------------------------------
    # Get user inputs
    # --------------------------------------------------------

    weight = get_weight()

    cargo_category = get_cargo_category()

    cargo_type = get_cargo_type(
        df,
        cargo_category
    )

    # --------------------------------------------------------
    # Recommend vessel
    # --------------------------------------------------------

    best_vessel = recommend_vessel(
        df,
        cargo_category,
        cargo_type,
        weight
    )

    # --------------------------------------------------------
    # Display result
    # --------------------------------------------------------

    if best_vessel is not None:

        display_result(best_vessel)

    else:

        # This should practically never happen
        # because we use fallback logic.

        print(
            "\nUnable to recommend a vessel."
        )


# ============================================================
# PROGRAM START
# ============================================================

if __name__ == "__main__":
    main()