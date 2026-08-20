# ============================================================
# MANUFACTURING DEFECT REASONING
# ============================================================


def generate_reasoning(
    status,
    anomaly_score,
    defect_type=None,
):
    """
    Generate a deterministic explanation for the inspection result.
    """

    if status == "PASS":

        return {
            "reason": (
                "No significant deviation from the "
                "learned normal product pattern was detected."
            ),
            "potential_impact": None,
            "recommended_action": (
                "Product can proceed to the next "
                "inspection stage."
            ),
        }

    if defect_type == "logical_anomaly":

        return {
            "reason": (
                "The product differs from the expected "
                "component arrangement or assembly pattern."
            ),
            "potential_impact": (
                "A missing, misplaced, or incorrectly "
                "assembled component may affect product "
                "functionality or downstream assembly."
            ),
            "recommended_action": (
                "Inspect the affected component and "
                "verify the assembly against the expected "
                "configuration."
            ),
        }

    if defect_type == "structural_anomaly":

        return {
            "reason": (
                "A visible structural deviation from the "
                "normal product appearance was detected."
            ),
            "potential_impact": (
                "The defect may indicate physical damage, "
                "surface degradation, contamination, or "
                "another manufacturing inconsistency."
            ),
            "recommended_action": (
                "Inspect the affected region and segregate "
                "the product if the defect is confirmed."
            ),
        }

    return {
        "reason": (
            "A significant deviation from the learned "
            "normal product pattern was detected."
        ),
        "potential_impact": (
            "The anomaly may indicate a manufacturing "
            "quality issue requiring further inspection."
        ),
        "recommended_action": (
            "Inspect the highlighted region before "
            "allowing the product to proceed."
        ),
    }