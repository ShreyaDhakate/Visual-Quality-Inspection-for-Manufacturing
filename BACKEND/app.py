from pathlib import Path
import uuid

from flask import (
    Flask,
    jsonify,
    request,
    send_from_directory,
)
from flask_cors import CORS

from services.inference_service import InferenceService
from services.reasoning_service import generate_reasoning


# ============================================================
# APP CONFIGURATION
# ============================================================

app = Flask(__name__)

CORS(app)

BACKEND_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BACKEND_DIR / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp",
}


# ============================================================
# PATCHCORE SERVICE
# ============================================================

print("\nInitializing inspection service...")

inference_service = InferenceService()

print("✓ Inspection service ready")


# ============================================================
# HELPERS
# ============================================================

def allowed_file(filename):

    if not filename:
        return False

    extension = (
        filename.rsplit(".",1)[-1]
        .lower()
    )

    return extension in ALLOWED_EXTENSIONS


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    return jsonify({
        "status": "ok",
        "service": "Visual Quality Inspection API",
        "model": "PatchCore",
    })


# ============================================================
# INSPECTION ENDPOINT
# ============================================================

@app.post("/api/inspect")
def inspect_product():

    image_path = None

    try:

        # ----------------------------------------------------
        # Validate image
        # ----------------------------------------------------

        if "image" not in request.files:

            return jsonify({
                "success": False,
                "error": (
                    "No image provided. "
                    "Use form-data field 'image'."
                ),
            }), 400

        image = request.files["image"]

        if not image.filename:

            return jsonify({
                "success": False,
                "error": "Image filename is empty.",
            }), 400

        if not allowed_file(image.filename):

            return jsonify({
                "success": False,
                "error": (
                    "Unsupported image format. "
                    "Use PNG, JPG, JPEG, or WEBP."
                ),
            }), 400

        # ----------------------------------------------------
        # Save uploaded image
        # ----------------------------------------------------

        extension = (
            image.filename
            .rsplit(".",1)[-1]
            .lower()
        )

        filename = (
            f"{uuid.uuid4().hex}.{extension}"
        )

        image_path = UPLOAD_DIR / filename

        image.save(image_path)

        print(
            f"\nUploaded image: {image_path}"
        )

        # ----------------------------------------------------
        # Run PatchCore
        # ----------------------------------------------------

        result = inference_service.inspect(
            image_path
        )

        print("\nPatchCore result:")
        print(result)

        # ----------------------------------------------------
        # Reasoning
        # ----------------------------------------------------

        reasoning = generate_reasoning(
            status=result["status"],
            anomaly_score=result["anomaly_score"],
            defect_type=None,
        )

        # ----------------------------------------------------
        # Visualization
        # ----------------------------------------------------

        visualization = result.get(
            "visualization",
            None,
        )

        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        response = {
            "success": True,

            "inspection": {
                "status": result["status"],
                "anomaly_detected": (
                    result["anomaly_detected"]
                ),
                "anomaly_score": (
                    result["anomaly_score"]
                ),
            },

            "localization": {
                "bounding_box": (
                    result["bounding_box"]
                ),

                "anomaly_map_size": (
                    result["anomaly_map_size"]
                ),
            },

            "visualization": visualization,

            "analysis": {
                "defect_type": None,

                "reason": (
                    reasoning["reason"]
                ),

                "potential_impact": (
                    reasoning["potential_impact"]
                ),

                "recommended_action": (
                    reasoning["recommended_action"]
                ),
            },
        }

        print("\nFinal API response:")
        print(response)

        return jsonify(response), 200

    except Exception as error:

        print("\n" + "=" * 60)
        print("INSPECTION ERROR")
        print("=" * 60)

        print(error)

        return jsonify({
            "success": False,
            "error": str(error),
        }), 500

    finally:

        # ----------------------------------------------------
        # Remove temporary upload
        # ----------------------------------------------------

        if image_path is not None:

            try:

                image_path.unlink()

            except OSError:

                pass


# ============================================================
# SERVE GENERATED VISUALIZATIONS
# ============================================================

@app.get(
    "/outputs/inspections/<inspection_id>/<filename>"
)
def get_inspection_output(
    inspection_id,
    filename,
):

    output_directory = (
        BACKEND_DIR
        / "outputs"
        / "inspections"
        / inspection_id
    )

    return send_from_directory(
        output_directory,
        filename,
    )


# ============================================================
# SERVER
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("VISUAL QUALITY INSPECTION API")
    print("=" * 60)

    print(
        "Health: "
        "http://127.0.0.1:5000/api/health"
    )

    print(
        "Inspect: "
        "POST http://127.0.0.1:5000/api/inspect"
    )

    print(
        "Outputs: "
        "http://127.0.0.1:5000/outputs/inspections/"
    )

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
    )