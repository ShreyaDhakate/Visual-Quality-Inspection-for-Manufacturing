from pathlib import Path

from anomalib.engine import Engine
from anomalib.models import Patchcore


# ============================================================
# PROJECT PATHS
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

PROJECT_ROOT = BACKEND_DIR.parent

DATASET_ROOT = (
    PROJECT_ROOT
    / "DATASET"
    / "mvtec_loco_anomaly_detection"
)

CHECKPOINT = (
    BACKEND_DIR
    / "results"
    / "Patchcore"
    / "MVTecLOCO"
    / "juice_bottle"
    / "v0"
    / "weights"
    / "lightning"
    / "model.ckpt"
)

CATEGORY = "juice_bottle"


# ============================================================
# TEST IMAGE SELECTION
# ============================================================

TEST_GOOD_DIR = (
    DATASET_ROOT
    / CATEGORY
    / "test"
    / "good"
)

TEST_LOGICAL_DIR = (
    DATASET_ROOT
    / CATEGORY
    / "test"
    / "logical_anomalies"
)

TEST_STRUCTURAL_DIR = (
    DATASET_ROOT
    / CATEGORY
    / "test"
    / "structural_anomalies"
)


def get_first_image(directory):
    """Return the first PNG image from a directory."""

    if not directory.exists():
        raise FileNotFoundError(
            f"Directory not found:\n{directory}"
        )

    images = sorted(directory.glob("*.png"))

    if not images:
        raise FileNotFoundError(
            f"No PNG images found in:\n{directory}"
        )

    return images[0]


# ============================================================
# DISPLAY HELPERS
# ============================================================

def print_prediction_value(name, value):
    print(f"{name}: {value}")


def inspect_prediction(prediction):
    """
    Print all useful fields returned by Anomalib.
    """

    print("\n" + "-" * 60)
    print("RAW PREDICTION")
    print("-" * 60)

    print(f"Prediction type: {type(prediction)}")

    # --------------------------------------------------------
    # ImageBatch / dictionary-like object
    # --------------------------------------------------------

    try:
        print(f"Available fields: {list(prediction.keys())}")
    except Exception:
        pass

    # --------------------------------------------------------
    # Ground truth label
    # --------------------------------------------------------

    try:
        print_prediction_value(
            "Ground truth label",
            prediction["gt_label"],
        )
    except Exception:
        pass

    # --------------------------------------------------------
    # Prediction label
    # --------------------------------------------------------

    try:
        print_prediction_value(
            "Prediction label",
            prediction["pred_label"],
        )
    except Exception:
        pass

    # --------------------------------------------------------
    # Prediction score
    # --------------------------------------------------------

    try:
        score = prediction["pred_score"]

        print_prediction_value(
            "Anomaly score",
            score,
        )

        try:
            print_prediction_value(
                "Anomaly score type",
                type(score),
            )
        except Exception:
            pass

    except Exception:
        pass

    # --------------------------------------------------------
    # Anomaly map
    # --------------------------------------------------------

    try:
        anomaly_map = prediction["anomaly_map"]

        print_prediction_value(
            "Anomaly map shape",
            anomaly_map.shape,
        )

    except Exception:
        pass

    # --------------------------------------------------------
    # Prediction mask
    # --------------------------------------------------------

    try:
        pred_mask = prediction["pred_mask"]

        print_prediction_value(
            "Prediction mask shape",
            pred_mask.shape,
        )

    except Exception:
        pass

    # --------------------------------------------------------
    # Image path
    # --------------------------------------------------------

    try:
        print_prediction_value(
            "Image path",
            prediction["image_path"],
        )

    except Exception:
        pass


# ============================================================
# RUN SINGLE IMAGE PREDICTION
# ============================================================

def run_prediction(model,engine,image_path):

    print("\n" + "=" * 60)
    print("RUNNING PATCHCORE INFERENCE")
    print("=" * 60)

    print(f"Image: {image_path}")

    predictions = engine.predict(
        model=model,
        data_path=image_path,
        ckpt_path=CHECKPOINT,
        return_predictions=True,
    )

    if predictions is None:
        print("\nNo predictions were returned.")
        return None

    print(
        f"\nPrediction batches returned: "
        f"{len(predictions)}"
    )

    for prediction in predictions:

        inspect_prediction(prediction)

    return predictions


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("VISUAL QUALITY INSPECTION")
    print("PATCHCORE SINGLE IMAGE TEST")
    print("=" * 60)

    # --------------------------------------------------------
    # Verify checkpoint
    # --------------------------------------------------------

    print("\nChecking checkpoint...")

    if not CHECKPOINT.exists():
        raise FileNotFoundError(
            f"\nPatchCore checkpoint not found:\n"
            f"{CHECKPOINT}"
        )

    print("✓ Checkpoint found")

    # --------------------------------------------------------
    # Verify dataset
    # --------------------------------------------------------

    print("\nChecking dataset...")

    if not DATASET_ROOT.exists():
        raise FileNotFoundError(
            f"\nDataset root not found:\n"
            f"{DATASET_ROOT}"
        )

    print("✓ Dataset root found")

    # --------------------------------------------------------
    # Find test images
    # --------------------------------------------------------

    good_image = get_first_image(TEST_GOOD_DIR)

    logical_image = get_first_image(
        TEST_LOGICAL_DIR
    )

    structural_image = get_first_image(
        TEST_STRUCTURAL_DIR
    )

    print("\nTest images selected:")

    print(f"GOOD:")
    print(good_image)

    print(f"\nLOGICAL:")
    print(logical_image)

    print(f"\nSTRUCTURAL:")
    print(structural_image)

    # --------------------------------------------------------
    # Create PatchCore model
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("CREATING PATCHCORE MODEL")
    print("=" * 60)

    model = Patchcore(
        backbone="wide_resnet50_2",
        layers=("layer2", "layer3"),
        pre_trained=True,
        coreset_sampling_ratio=0.1,
        num_neighbors=9,
        precision="float32",
    )

    print("✓ PatchCore model created")

    # --------------------------------------------------------
    # Create Engine
    # --------------------------------------------------------

    engine = Engine(
        default_root_dir=BACKEND_DIR / "results"
    )

    print("✓ Anomalib Engine created")

    # --------------------------------------------------------
    # GOOD IMAGE
    # --------------------------------------------------------

    print("\n\n")
    print("#" * 60)
    print("# TEST 1 — GOOD PRODUCT")
    print("#" * 60)

    good_predictions = run_prediction(
        model,
        engine,
        good_image,
    )

    # --------------------------------------------------------
    # LOGICAL ANOMALY
    # --------------------------------------------------------

    print("\n\n")
    print("#" * 60)
    print("# TEST 2 — LOGICAL ANOMALY")
    print("#" * 60)

    logical_predictions = run_prediction(
        model,
        engine,
        logical_image,
    )

    # --------------------------------------------------------
    # STRUCTURAL ANOMALY
    # --------------------------------------------------------

    print("\n\n")
    print("#" * 60)
    print("# TEST 3 — STRUCTURAL ANOMALY")
    print("#" * 60)

    structural_predictions = run_prediction(
        model,
        engine,
        structural_image,
    )

    # --------------------------------------------------------
    # COMPLETE
    # --------------------------------------------------------

    print("\n\n")
    print("=" * 60)
    print("PATCHCORE INFERENCE TEST COMPLETE")
    print("=" * 60)

    print("\nWe tested:")

    print(f"✓ Good image:")
    print(f"  {good_image.name}")

    print(f"✓ Logical anomaly:")
    print(f"  {logical_image.name}")

    print(f"✓ Structural anomaly:")
    print(f"  {structural_image.name}")

    print("\nNext step:")
    print("Compare anomaly scores and localization maps.")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()