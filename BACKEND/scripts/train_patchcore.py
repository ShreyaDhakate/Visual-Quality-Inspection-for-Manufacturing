from pathlib import Path

import torch

from anomalib.data import MVTecLOCO
from anomalib.engine import Engine
from anomalib.models import Patchcore


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_ROOT = (
    PROJECT_ROOT
    / "DATASET"
    / "mvtec_loco_anomaly_detection"
)

RESULTS_ROOT = (
    PROJECT_ROOT
    / "BACKEND"
    / "results"
)

CATEGORY = "juice_bottle"


# ============================================================
# CONFIGURATION
# ============================================================

TRAIN_BATCH_SIZE = 4
EVAL_BATCH_SIZE = 4
NUM_WORKERS = 0

CORESET_SAMPLING_RATIO = 0.05
NUM_NEIGHBORS = 9



# ============================================================
# DEVICE
# ============================================================

def get_device():
    if torch.cuda.is_available():
        device = torch.device("cuda")

        print("=" * 60)
        print("GPU ENABLED")
        print("=" * 60)

        print(f"GPU: {torch.cuda.get_device_name(0)}")

        total_memory = (
            torch.cuda.get_device_properties(0).total_memory
            / 1024**3
        )

        print(f"VRAM: {total_memory:.2f} GB")
        print()

        return device

    print("=" * 60)
    print("WARNING: CUDA NOT AVAILABLE")
    print("Using CPU")
    print("=" * 60)

    return torch.device("cpu")


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("INSPECTAI — PATCHCORE TRAINING")
    print("=" * 60)

    # --------------------------------------------------------
    # Device
    # --------------------------------------------------------

    device = get_device()

    # --------------------------------------------------------
    # Dataset validation
    # --------------------------------------------------------

    if not DATASET_ROOT.exists():
        raise FileNotFoundError(
            f"Dataset not found:\n{DATASET_ROOT}"
        )

    category_path = DATASET_ROOT / CATEGORY

    if not category_path.exists():
        raise FileNotFoundError(
            f"Category not found:\n{category_path}"
        )

    print(f"Dataset: {DATASET_ROOT}")
    print(f"Category: {CATEGORY}")

    # --------------------------------------------------------
    # Create MVTec LOCO DataModule
    # --------------------------------------------------------

    print("\nCreating MVTec LOCO datamodule...")

    datamodule = MVTecLOCO(
        root=str(DATASET_ROOT),
        category=CATEGORY,
        train_batch_size=TRAIN_BATCH_SIZE,
        eval_batch_size=EVAL_BATCH_SIZE,
        num_workers=NUM_WORKERS,
    )

    # --------------------------------------------------------
    # Create PatchCore model
    # --------------------------------------------------------

    print("\nCreating PatchCore model...")

    model = Patchcore(
        backbone="wide_resnet50_2",
        layers=("layer2", "layer3"),
        pre_trained=True,
        coreset_sampling_ratio=CORESET_SAMPLING_RATIO,
        num_neighbors=NUM_NEIGHBORS,
        precision="float32",
    )

    # --------------------------------------------------------
    # Move model to GPU
    # --------------------------------------------------------



    print("PatchCore configuration:")
    print("  Backbone:", "wide_resnet50_2")
    print("  Layers:", ("layer2", "layer3"))
    print("  Pretrained:", True)
    print(
        "  Coreset sampling ratio:",
        CORESET_SAMPLING_RATIO,
    )
    print("  Neighbors:", NUM_NEIGHBORS)
    print("  Precision:", "float32")

    # --------------------------------------------------------
    # Engine
    # --------------------------------------------------------

    RESULTS_ROOT.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("\nCreating Anomalib engine...")

    engine = Engine(
        default_root_dir=str(RESULTS_ROOT),
    )

    # --------------------------------------------------------
    # Train / Fit PatchCore
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("STARTING PATCHCORE")
    print("=" * 60)

    engine.fit(
        model=model,
        datamodule=datamodule,
    )

    # --------------------------------------------------------
    # Test
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("RUNNING TEST EVALUATION")
    print("=" * 60)

    engine.test(
        model=model,
        datamodule=datamodule,
    )

    # --------------------------------------------------------
    # Complete
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("PATCHCORE RUN COMPLETED")
    print("=" * 60)

    print(f"Results saved to:\n{RESULTS_ROOT}")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()