import os
import sys
import pandas as pd


# ============================================================
# PROJECT PATH
# ============================================================

PROJECT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_DIR = os.path.join(
    PROJECT_DIR,
    "data"
)


# ============================================================
# FIND DATASETS
# ============================================================

def find_file(
    keywords
):

    files = os.listdir(
        DATA_DIR
    )

    for file in files:

        if not file.lower().endswith(
            ".csv"
        ):
            continue

        filename = file.lower()

        if all(
            keyword.lower() in filename
            for keyword in keywords
        ):

            return os.path.join(
                DATA_DIR,
                file
            )

    return None


def find_datasets():

    vessel_file = find_file(
        ["vessel"]
    )

    india_file = find_file(
        ["india", "port"]
    )

    international_file = find_file(
        ["international", "port"]
    )

    return (
        vessel_file,
        india_file,
        international_file
    )


# ============================================================
# IMPORT ENGINES
# ============================================================

from engine.vessel_engine import (
    load_vessel_dataset,
    get_cargo_types,
    recommend_vessels,
    display_candidates
)

from engine.port_engine import (
    load_india_ports,
    load_international_ports,
    check_vessel_port
)


# ============================================================
# INPUT - WEIGHT
# ============================================================

def get_weight():

    while True:

        value = input(
            "\nEnter cargo weight (tonnes): "
        ).strip()

        try:

            weight = float(
                value
            )

            if weight <= 0:

                print(
                    "Weight must be greater than 0."
                )

                continue

            return weight

        except ValueError:

            print(
                "Please enter a valid numeric weight."
            )


# ============================================================
# INPUT - CATEGORY
# ============================================================

def get_category():

    print(
        "\n## SELECT CARGO CATEGORY\n"
    )

    print(
        "1. Dry Bulk"
    )

    print(
        "2. Liquid Bulk"
    )

    print(
        "3. Gas Bulk"
    )

    mapping = {
        "1": "Dry Bulk",
        "2": "Liquid Bulk",
        "3": "Gas Bulk"
    }

    while True:

        choice = input(
            "\nEnter choice (1-3): "
        ).strip()

        if choice in mapping:

            return mapping[
                choice
            ]

        print(
            "Invalid choice."
        )


# ============================================================
# INPUT - CARGO TYPE
# ============================================================

def get_cargo_type(
    df,
    category
):

    cargo_types = get_cargo_types(
        df,
        category
    )

    print(
        "\n## AVAILABLE CARGO TYPES\n"
    )

    if not cargo_types:

        print(
            "No predefined cargo types found."
        )

        while True:

            value = input(
                "\nEnter cargo type: "
            ).strip()

            if value:

                return value

    for index, cargo_type in enumerate(
        cargo_types,
        start=1
    ):

        print(
            f"{index}. {cargo_type}"
        )

    while True:

        value = input(
            "\nEnter the number or cargo name: "
        ).strip()

        # Number
        if value.isdigit():

            number = int(
                value
            )

            if 1 <= number <= len(
                cargo_types
            ):

                return cargo_types[
                    number - 1
                ]

            print(
                "Invalid number."
            )

            continue

        # Name
        for cargo_type in cargo_types:

            if value.lower() == cargo_type.lower():

                return cargo_type

        print(
            "Cargo type not found."
        )


# ============================================================
# INPUT - PORT
# ============================================================

def get_port(
    prompt,
    india_df,
    international_df
):

    while True:

        value = input(
            f"\n{prompt}: "
        ).strip()

        if not value:

            print(
                "Port name cannot be empty."
            )

            continue

        # Exact/partial validation
        from engine.port_engine import find_port

        result = find_port(
            value,
            india_df,
            international_df
        )

        if result["found"]:

            # If partial search returned several ports,
            # show the matching possibilities.

            unique_ports = (
                result["rows"]["port"]
                .dropna()
                .unique()
                .tolist()
            )

            if len(unique_ports) > 1:

                print(
                    "\nMultiple ports found:"
                )

                for port in unique_ports[
                    :10
                ]:

                    print(
                        f" - {port}"
                    )

                print(
                    "\nPlease enter the exact port name."
                )

                continue

            actual_port = unique_ports[0]

            print(
                f"Port selected: {actual_port}"
            )

            print(
                f"Country: "
                f"{result['rows']['country'].iloc[0]}"
            )

            return actual_port

        print(
            "Port not found in the available datasets."
        )

        print(
            "Please enter another port name."
        )


# ============================================================
# CHECK ALL VESSELS
# ============================================================

def find_final_vessel(
    candidates,
    origin,
    destination,
    cargo_category,
    cargo_type,
    india_df,
    international_df
):

    print(
        "\n" + "=" * 75
    )

    print(
        "PORT COMPATIBILITY ENGINE"
    )

    print(
        "=" * 75
    )

    # --------------------------------------------------------
    # Test candidates one by one
    # --------------------------------------------------------

    for index, vessel in candidates.iterrows():

        rank = index + 1

        print(
            f"\nChecking Vessel Candidate #{rank}"
        )

        print(
            f"Vessel Type: "
            f"{vessel['vessel_type']}"
        )

        # ----------------------------------------------------
        # Origin check
        # ----------------------------------------------------

        origin_result = check_vessel_port(
            vessel,
            origin,
            cargo_category,
            cargo_type,
            india_df,
            international_df
        )

        if not origin_result["found"]:

            print(
                "Origin Port: NOT FOUND"
            )

            continue

        if origin_result["compatible"]:

            print(
                "Origin Compatibility: PASS"
            )

        else:

            print(
                "Origin Compatibility: FAIL"
            )

            continue

        # ----------------------------------------------------
        # Destination check
        # ----------------------------------------------------

        destination_result = check_vessel_port(
            vessel,
            destination,
            cargo_category,
            cargo_type,
            india_df,
            international_df
        )

        if not destination_result["found"]:

            print(
                "Destination Port: NOT FOUND"
            )

            continue

        if destination_result["compatible"]:

            print(
                "Destination Compatibility: PASS"
            )

        else:

            print(
                "Destination Compatibility: FAIL"
            )

            continue

        # ----------------------------------------------------
        # Both passed
        # ----------------------------------------------------

        print(
            "\n*** VESSEL PASSED BOTH PORTS ***"
        )

        return {
            "vessel": vessel,
            "origin": origin_result,
            "destination": destination_result,
            "rank": rank
        }

    # --------------------------------------------------------
    # Nothing passed
    # --------------------------------------------------------

    return None


# ============================================================
# FINAL OUTPUT
# ============================================================

def display_final_result(
    result,
    cargo_weight,
    cargo_category,
    cargo_type,
    origin,
    destination
):

    vessel = result["vessel"]

    origin_result = result[
        "origin"
    ]

    destination_result = result[
        "destination"
    ]

    print(
        "\n\n" + "=" * 75
    )

    print(
        "FINAL VESSEL RECOMMENDATION"
    )

    print(
        "=" * 75
    )

    print(
        f"\nCargo Weight     : "
        f"{cargo_weight:,.2f} tonnes"
    )

    print(
        f"Cargo Category   : "
        f"{cargo_category}"
    )

    print(
        f"Cargo Type       : "
        f"{cargo_type}"
    )

    print(
        f"\nOrigin           : "
        f"{origin}"
    )

    print(
        f"Destination      : "
        f"{destination}"
    )

    print(
        "\n" + "-" * 75
    )

    print(
        "SELECTED VESSEL"
    )

    print(
        "-" * 75
    )

    print(
        f"\nVessel Type      : "
        f"{vessel['vessel_type']}"
    )

    print(
        f"Maximum DWT      : "
        f"{vessel['max_dwt']:,.2f} tonnes"
    )

    print(
        f"Draft            : "
        f"{vessel['draft']:.2f} m"
    )

    print(
        f"LOA              : "
        f"{vessel['loa']:.2f} m"
    )

    print(
        f"Beam             : "
        f"{vessel['beam']:.2f} m"
    )

    print(
        f"\nVessel Model Rank: "
        f"{result['rank']}"
    )

    print(
        "\n" + "-" * 75
    )

    print(
        "ORIGIN PORT"
    )

    print(
        "-" * 75
    )

    print(
        f"Port             : "
        f"{origin}"
    )

    print(
        f"Dataset          : "
        f"{origin_result['dataset']}"
    )

    print(
        "Compatibility    : PASS"
    )

    print(
        f"Compatible Berth : "
        f"{origin_result['berth']['berth']}"
    )

    print(
        "\n" + "-" * 75
    )

    print(
        "DESTINATION PORT"
    )

    print(
        "-" * 75
    )

    print(
        f"Port             : "
        f"{destination}"
    )

    print(
        f"Dataset          : "
        f"{destination_result['dataset']}"
    )

    print(
        "Compatibility    : PASS"
    )

    print(
        f"Compatible Berth : "
        f"{destination_result['berth']['berth']}"
    )

    print(
        "\n" + "=" * 75
    )

    print(
        "VESSEL SUCCESSFULLY SELECTED"
    )

    print(
        "=" * 75
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "\n" + "=" * 75
    )

    print(
        "INTELLIGENT FREIGHT VESSEL "
        "OPTIMIZATION SYSTEM"
    )

    print(
        "SIH 26006"
    )

    print(
        "=" * 75
    )

    # --------------------------------------------------------
    # Find datasets
    # --------------------------------------------------------

    (
        vessel_file,
        india_file,
        international_file
    ) = find_datasets()

    if not vessel_file:

        print(
            "\nERROR: Vessel CSV not found."
        )

        return

    if not india_file:

        print(
            "\nERROR: India port CSV not found."
        )

        return

    if not international_file:

        print(
            "\nERROR: International port CSV not found."
        )

        return

    print(
        f"\nVessel Dataset:"
        f"\n{vessel_file}"
    )

    print(
        f"\nIndia Port Dataset:"
        f"\n{india_file}"
    )

    print(
        f"\nInternational Port Dataset:"
        f"\n{international_file}"
    )

    # --------------------------------------------------------
    # Load datasets
    # --------------------------------------------------------

    vessel_df = load_vessel_dataset(
        vessel_file
    )

    india_df = load_india_ports(
        india_file
    )

    international_df = load_international_ports(
        international_file
    )

    # --------------------------------------------------------
    # User inputs
    # --------------------------------------------------------

    cargo_weight = get_weight()

    cargo_category = get_category()

    cargo_type = get_cargo_type(
        vessel_df,
        cargo_category
    )

    origin = get_port(
        "Enter origin port",
        india_df,
        international_df
    )

    destination = get_port(
        "Enter destination port",
        india_df,
        international_df
    )

    # --------------------------------------------------------
    # MODEL 1
    # --------------------------------------------------------

    print(
        "\n" + "=" * 75
    )

    print(
        "MODEL 1 - VESSEL RECOMMENDATION"
    )

    print(
        "=" * 75
    )

    candidates = recommend_vessels(
        vessel_df,
        cargo_category,
        cargo_type,
        cargo_weight,
        top_n=20
    )

    if candidates.empty:

        print(
            "\nNo vessel candidates available."
        )

        return

    display_candidates(
        candidates
    )

    # --------------------------------------------------------
    # PORT COMPATIBILITY ENGINE
    # --------------------------------------------------------

    final_result = find_final_vessel(
        candidates,
        origin,
        destination,
        cargo_category,
        cargo_type,
        india_df,
        international_df
    )

    # --------------------------------------------------------
    # FINAL
    # --------------------------------------------------------

    if final_result is None:

        print(
            "\n" + "=" * 75
        )

        print(
            "NO PORT-COMPATIBLE VESSEL FOUND"
        )

        print(
            "=" * 75
        )

        print(
            "\nThe Vessel Model generated candidates, "
            "but none of the tested vessels satisfy "
            "both origin and destination port constraints."
        )

        print(
            "\nTry another origin/destination combination."
        )

        return

    display_final_result(
        final_result,
        cargo_weight,
        cargo_category,
        cargo_type,
        origin,
        destination
    )


# ============================================================
# PROGRAM START
# ============================================================

if __name__ == "__main__":

    main()