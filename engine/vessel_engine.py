import pandas as pd


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
# TEXT UTILITIES
# ============================================================

def clean_text(value):
    if pd.isna(value):
        return ""

    return str(value).strip().lower()


def normalize_category(value):

    value = clean_text(value)

    mapping = {
        "dry bulk": "Dry Bulk",
        "drybulk": "Dry Bulk",

        "liquid bulk": "Liquid Bulk",
        "liquidbulk": "Liquid Bulk",

        "gas bulk": "Gas Bulk",
        "gasbulk": "Gas Bulk",
        "bulk gas": "Gas Bulk",
        "bulk gases": "Gas Bulk"
    }

    return mapping.get(value, value.title())


# ============================================================
# LOAD VESSEL DATASET
# ============================================================

def load_vessel_dataset(file_path):

    print("\nLoading vessel dataset...")

    try:

        df = pd.read_csv(file_path)

    except Exception as e:

        raise Exception(
            f"Unable to load vessel dataset:\n{e}"
        )

    missing = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing:

        raise Exception(
            "Vessel dataset is missing columns:\n"
            + "\n".join(missing)
        )

    # Normalize category
    df["cargo_category"] = df[
        "cargo_category"
    ].apply(normalize_category)

    # Clean text
    df["cargo_type"] = df[
        "cargo_type"
    ].astype(str).str.strip()

    df["vessel_type"] = df[
        "vessel_type"
    ].astype(str).str.strip()

    # Numeric fields
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

    # Remove invalid rows
    df = df.dropna(
        subset=[
            "max_dwt",
            "draft",
            "loa",
            "beam"
        ]
    )

    df = df[df["max_dwt"] > 0]

    df["cargo_category_clean"] = df["cargo_category"].astype(str).str.strip().str.lower()
    df["cargo_type_clean"] = df["cargo_type"].astype(str).str.strip().str.lower()

    print(
        f"Vessel dataset loaded: {len(df):,} records"
    )

    return df


# ============================================================
# GET CARGO TYPES
# ============================================================

def get_cargo_types(df, category):

    category_df = df[
        df["cargo_category"] == category
    ]

    cargo_types = sorted(
        category_df[
            "cargo_type"
        ].dropna().unique().tolist()
    )

    return cargo_types


# ============================================================
# RECOMMEND TOP VESSELS
# ============================================================

def recommend_vessels(
    df,
    cargo_category,
    cargo_type,
    cargo_weight,
    top_n=20
):

    category_clean = clean_text(
        cargo_category
    )

    cargo_type_clean = clean_text(
        cargo_type
    )

    # --------------------------------------------------------
    # STEP 1: Category matching
    # --------------------------------------------------------

    cat_col = df["cargo_category_clean"] if "cargo_category_clean" in df.columns else df["cargo_category"].apply(normalize_category).astype(str).str.strip().str.lower()
    category_matches = df[cat_col == category_clean].copy()

    # --------------------------------------------------------
    # STEP 2: Exact cargo type matching
    # --------------------------------------------------------

    type_col = category_matches["cargo_type_clean"] if "cargo_type_clean" in category_matches.columns else category_matches["cargo_type"].astype(str).str.strip().str.lower()
    type_matches = category_matches[type_col == cargo_type_clean].copy()

    # --------------------------------------------------------
    # Candidate selection
    #
    # Priority:
    # 1. Exact cargo type
    # 2. Cargo category
    # 3. Entire dataset
    # --------------------------------------------------------

    if not type_matches.empty:

        candidates = type_matches.copy()

        match_level = "Exact Cargo Type"

    elif not category_matches.empty:

        candidates = category_matches.copy()

        match_level = "Cargo Category"

    else:

        candidates = df.copy()

        match_level = "Complete Vessel Dataset"

    # --------------------------------------------------------
    # Calculate DWT difference
    # --------------------------------------------------------

    candidates["weight_difference"] = (
        candidates["max_dwt"] - cargo_weight
    ).abs()

    # --------------------------------------------------------
    # Check whether vessel can carry cargo
    #
    # IMPORTANT:
    # This is NOT a hard filter.
    # --------------------------------------------------------

    candidates["can_carry"] = (
        candidates["max_dwt"] >= cargo_weight
    )

    # --------------------------------------------------------
    # Check whether cargo falls within DWT range
    # --------------------------------------------------------

    candidates["within_dwt_range"] = (
        (candidates["min_dwt"] <= cargo_weight)
        &
        (cargo_weight <= candidates["max_dwt"])
    )

    # --------------------------------------------------------
    # Ranking
    #
    # Priority:
    #
    # 1. Can carry cargo
    # 2. Weight falls within DWT range
    # 3. Closest DWT
    # --------------------------------------------------------

    candidates = candidates.sort_values(
        by=[
            "can_carry",
            "within_dwt_range",
            "weight_difference"
        ],
        ascending=[
            False,
            False,
            True
        ]
    )

    # --------------------------------------------------------
    # Remove exact duplicates
    # --------------------------------------------------------

    candidates = candidates.drop_duplicates(
        subset=[
            "cargo_category",
            "cargo_type",
            "vessel_type",
            "min_dwt",
            "max_dwt",
            "draft",
            "loa",
            "beam"
        ]
    )

    candidates = candidates.head(
        top_n
    ).copy()

    candidates["match_level"] = match_level

    return candidates.reset_index(
        drop=True
    )


# ============================================================
# DISPLAY CANDIDATES
# ============================================================

def display_candidates(candidates):

    print("\n" + "=" * 75)
    print("VESSEL MODEL - TOP CANDIDATES")
    print("=" * 75)

    for index, vessel in candidates.iterrows():

        print(
            f"\nRank {index + 1}"
        )

        print(
            f"Vessel Type : {vessel['vessel_type']}"
        )

        print(
            f"Maximum DWT : {vessel['max_dwt']:,.2f}"
        )

        print(
            f"Draft       : {vessel['draft']:.2f} m"
        )

        print(
            f"LOA         : {vessel['loa']:.2f} m"
        )

        print(
            f"Beam        : {vessel['beam']:.2f} m"
        )

    print("\n" + "=" * 75)