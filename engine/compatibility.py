# ============================================================
# VESSEL VS PORT COMPATIBILITY
# ============================================================


def check_vessel_port_compatibility(
    vessel,
    port_row
):

    vessel_draft = float(
        vessel["draft"]
    )

    vessel_loa = float(
        vessel["loa"]
    )

    vessel_beam = float(
        vessel["beam"]
    )

    max_draft = float(
        port_row["max_draft"]
    )

    max_loa = float(
        port_row["max_loa"]
    )

    max_beam = float(
        port_row["max_beam"]
    )

    # --------------------------------------------------------
    # Individual checks
    # --------------------------------------------------------

    draft_pass = (
        vessel_draft <= max_draft
    )

    loa_pass = (
        vessel_loa <= max_loa
    )

    beam_pass = (
        vessel_beam <= max_beam
    )

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    compatible = (
        draft_pass
        and loa_pass
        and beam_pass
    )

    return {
        "compatible": compatible,

        "draft_pass": draft_pass,
        "loa_pass": loa_pass,
        "beam_pass": beam_pass,

        "vessel_draft": vessel_draft,
        "vessel_loa": vessel_loa,
        "vessel_beam": vessel_beam,

        "max_draft": max_draft,
        "max_loa": max_loa,
        "max_beam": max_beam
    }


# ============================================================
# CHECK A VESSEL AGAINST ALL BERTHS
# ============================================================

def check_vessel_at_port(
    vessel,
    port_rows
):

    compatible_berths = []

    all_results = []

    for _, berth in port_rows.iterrows():

        result = check_vessel_port_compatibility(
            vessel,
            berth
        )

        result["port"] = berth["port"]
        result["berth"] = berth["berth"]

        all_results.append(result)

        if result["compatible"]:

            compatible_berths.append(
                result
            )

    # --------------------------------------------------------
    # If at least one berth passes
    # --------------------------------------------------------

    if compatible_berths:

        return {
            "compatible": True,
            "berth": compatible_berths[0],
            "all_results": all_results
        }

    # --------------------------------------------------------
    # No berth compatible
    # --------------------------------------------------------

    return {
        "compatible": False,
        "berth": None,
        "all_results": all_results
    }