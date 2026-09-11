import pandas as pd

from .compatibility import (
    check_vessel_at_port
)


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
        "bulk gases": "Gas Bulk",
        "bulk gas": "Gas Bulk"
    }

    return mapping.get(
        value,
        value.title()
    )


# ============================================================
# LOAD INDIA PORT DATASET
# ============================================================

def load_india_ports(file_path):

    try:

        df = pd.read_csv(
            file_path
        )

    except Exception as e:

        raise Exception(
            f"Unable to load India port dataset:\n{e}"
        )

    required_columns = [
        "country",
        "port",
        "berth",
        "cargo_category",
        "cargo_type",
        "max_draft",
        "max_loa",
        "max_beam"
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:

        raise Exception(
            "India port dataset is missing:\n"
            + "\n".join(missing)
        )

    df["cargo_category"] = df[
        "cargo_category"
    ].apply(normalize_category)

    df["port_clean"] = df["port"].astype(str).str.strip().str.lower()
    df["cargo_category_clean"] = df["cargo_category"].astype(str).str.strip().str.lower()
    df["cargo_type_clean"] = df["cargo_type"].astype(str).str.strip().str.lower()

    return df


# ============================================================
# LOAD INTERNATIONAL PORT DATASET
# ============================================================

def load_international_ports(file_path):

    try:

        df = pd.read_csv(
            file_path
        )

    except Exception as e:

        raise Exception(
            f"Unable to load international port dataset:\n{e}"
        )

    required_columns = [
        "country",
        "port",
        "berth",
        "cargo_category",
        "cargo_type",
        "max_draft",
        "max_loa",
        "max_beam"
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:

        raise Exception(
            "International port dataset is missing:\n"
            + "\n".join(missing)
        )

    df["cargo_category"] = df[
        "cargo_category"
    ].apply(normalize_category)

    df["port_clean"] = df["port"].astype(str).str.strip().str.lower()
    df["cargo_category_clean"] = df["cargo_category"].astype(str).str.strip().str.lower()
    df["cargo_type_clean"] = df["cargo_type"].astype(str).str.strip().str.lower()

    return df


# ============================================================
# FIND PORT
# ============================================================

def find_port(
    port_name,
    india_df,
    international_df
):

    search = clean_text(
        port_name
    )

    # --------------------------------------------------------
    # Search India
    # --------------------------------------------------------

    india_clean = india_df["port_clean"] if "port_clean" in india_df.columns else india_df["port"].astype(str).str.strip().str.lower()
    intl_clean = international_df["port_clean"] if "port_clean" in international_df.columns else international_df["port"].astype(str).str.strip().str.lower()

    india_matches = india_df[india_clean == search].copy()
    international_matches = international_df[intl_clean == search].copy()

    # --------------------------------------------------------
    # Exact matches
    # --------------------------------------------------------

    if not india_matches.empty:

        return {
            "found": True,
            "dataset": "India",
            "rows": india_matches
        }

    if not international_matches.empty:

        return {
            "found": True,
            "dataset": "International",
            "rows": international_matches
        }

    # --------------------------------------------------------
    # Partial search
    # --------------------------------------------------------

    india_partial = india_df[india_clean.str.contains(search, na=False, regex=False)].copy()
    international_partial = international_df[intl_clean.str.contains(search, na=False, regex=False)].copy()

    if not india_partial.empty:

        return {
            "found": True,
            "dataset": "India",
            "rows": india_partial
        }

    if not international_partial.empty:

        return {
            "found": True,
            "dataset": "International",
            "rows": international_partial
        }

    return {
        "found": False,
        "dataset": None,
        "rows": pd.DataFrame()
    }


# ============================================================
# CARGO-AWARE PORT ROW SELECTION
# ============================================================

def prepare_port_rows(
    port_rows,
    cargo_category,
    cargo_type
):

    category_clean = clean_text(cargo_category)
    cargo_type_clean = clean_text(cargo_type)

    cat_col = port_rows["cargo_category_clean"] if "cargo_category_clean" in port_rows.columns else port_rows["cargo_category"].apply(normalize_category).astype(str).str.strip().str.lower()
    type_col = port_rows["cargo_type_clean"] if "cargo_type_clean" in port_rows.columns else port_rows["cargo_type"].astype(str).str.strip().str.lower()

    category_matches = port_rows[cat_col == category_clean].copy()
    type_matches = category_matches[category_matches["cargo_type_clean" if "cargo_type_clean" in category_matches.columns else "cargo_type"].astype(str).str.strip().str.lower() == cargo_type_clean].copy()

    # --------------------------------------------------------
    # Priority
    #
    # Exact cargo type
    #       ↓
    # Category
    #       ↓
    # All port berths
    # --------------------------------------------------------

    if not type_matches.empty:

        return type_matches

    if not category_matches.empty:

        return category_matches

    return port_rows


# ============================================================
# CHECK VESSEL AT A PORT
# ============================================================

def check_vessel_port(
    vessel,
    port_name,
    cargo_category,
    cargo_type,
    india_df,
    international_df
):

    port_info = find_port(
        port_name,
        india_df,
        international_df
    )

    if not port_info["found"]:

        return {
            "found": False,
            "compatible": False,
            "dataset": None,
            "berth": None
        }

    port_rows = prepare_port_rows(
        port_info["rows"],
        cargo_category,
        cargo_type
    )

    result = check_vessel_at_port(
        vessel,
        port_rows
    )

    return {
        "found": True,
        "compatible": result["compatible"],
        "dataset": port_info["dataset"],
        "berth": result["berth"],
        "all_results": result["all_results"]
    }


# ============================================================
# DISPLAY PORT COMPATIBILITY
# ============================================================

def display_port_result(
    port_name,
    result
):

    print(
        f"\nPort: {port_name}"
    )

    if not result["found"]:

        print(
            "Port Status: NOT FOUND"
        )

        return

    print(
        f"Dataset: {result['dataset']}"
    )

    if result["compatible"]:

        berth = result["berth"]

        print(
            "Compatibility: PASS"
        )

        print(
            f"Compatible Berth: "
            f"{berth['berth']}"
        )

    else:

        print(
            "Compatibility: FAIL"
        )

        print(
            "No compatible berth found."
        )