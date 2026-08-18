from pathlib import Path

from anomalib.data import MVTecLOCO


# ============================================================
# PROJECT CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_ROOT = (
    PROJECT_ROOT
    / "DATASET"
    / "mvtec_loco_anomaly_detection"
)

CATEGORY = "juice_bottle"

TRAIN_BATCH_SIZE = 4
EVAL_BATCH_SIZE = 4
NUM_WORKERS = 0


# ============================================================
# DATASET VERIFICATION
# ============================================================

def main():
    print("=" * 60)
    print("MVTec LOCO Dataset Verification")
    print("=" * 60)

    print(f"Dataset root: {DATASET_ROOT}")
    print(f"Category: {CATEGORY}")

    # --------------------------------------------------------
    # Check dataset root
    # --------------------------------------------------------

    if not DATASET_ROOT.exists():
        raise FileNotFoundError(
            f"Dataset root not found:\n{DATASET_ROOT}"
        )

    # --------------------------------------------------------
    # Check category
    # --------------------------------------------------------

    category_path = DATASET_ROOT / CATEGORY

    if not category_path.exists():
        raise FileNotFoundError(
            f"Category not found:\n{category_path}"
        )

    print("\nDataset structure:")

    # --------------------------------------------------------
    # Check required folders
    # --------------------------------------------------------

    required_folders = [
        "train",
        "validation",
        "test",
        "ground_truth",
    ]

    for folder in required_folders:
        folder_path = category_path / folder

        if folder_path.exists():
            print(f"✓ {folder}/")
        else:
            print(f"✗ {folder}/ MISSING")

    # --------------------------------------------------------
    # Check train/good
    # --------------------------------------------------------

    train_good_path = category_path / "train" / "good"

    if not train_good_path.exists():
        raise FileNotFoundError(
            f"Training good folder not found:\n{train_good_path}"
        )

    train_images = list(train_good_path.glob("*.png"))

    print(f"\nTraining images found: {len(train_images)}")

    if len(train_images) == 0:
        raise RuntimeError(
            "No PNG images found inside train/good."
        )

    # --------------------------------------------------------
    # Check test categories
    # --------------------------------------------------------

    test_path = category_path / "test"

    test_categories = [
        "good",
        "logical_anomalies",
        "structural_anomalies",
    ]

    print("\nTest categories:")

    for test_category in test_categories:
        test_category_path = test_path / test_category

        if test_category_path.exists():
            images = list(test_category_path.glob("*.png"))
            print(
                f"✓ {test_category}/ "
                f"({len(images)} images)"
            )
        else:
            print(
                f"✗ {test_category}/ MISSING"
            )

    # --------------------------------------------------------
    # Load dataset through Anomalib
    # --------------------------------------------------------

    print("\nLoading MVTecLOCO through Anomalib...")

    datamodule = MVTecLOCO(
        root=str(DATASET_ROOT),
        category=CATEGORY,
        train_batch_size=TRAIN_BATCH_SIZE,
        eval_batch_size=EVAL_BATCH_SIZE,
        num_workers=NUM_WORKERS,
    )

    datamodule.setup()

    print("\n✓ Anomalib successfully loaded the dataset.")

    # --------------------------------------------------------
    # Load training batch
    # --------------------------------------------------------

    train_loader = datamodule.train_dataloader()

    batch = next(iter(train_loader))

    print("\nTraining batch:")
    print(f"Keys: {list(batch.keys())}")
    print(f"Image shape: {batch['image'].shape}")

    # --------------------------------------------------------
    # Display first training sample
    # --------------------------------------------------------

    print("\nFirst image:")

    image_path = batch["image_path"][0]
    ground_truth_label = batch["gt_label"][0]

    print(f"Path: {image_path}")
    print(f"Ground truth label: {ground_truth_label}")

    # --------------------------------------------------------
    # Dataset statistics
    # --------------------------------------------------------

    print("\nDataset statistics:")

    print(
        f"Training samples: "
        f"{len(datamodule.train_data)}"
    )

    print(
        f"Validation samples: "
        f"{len(datamodule.val_data)}"
    )

    print(
        f"Test samples: "
        f"{len(datamodule.test_data)}"
    )

    # --------------------------------------------------------
    # Final verification
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("DATASET VERIFICATION SUCCESSFUL")
    print("=" * 60)

    print("\nReady for PatchCore training:")
    print(f"Category: {CATEGORY}")
    print(f"Training images: {len(train_images)}")
    print(f"Image batch shape: {batch['image'].shape}")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()