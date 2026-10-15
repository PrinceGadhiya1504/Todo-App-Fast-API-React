
from uuid import uuid4
import os
from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

items = [
    {
        "id": 1,
        "name": "Learn React",
        "description": "Practice React basics",
        "status": "pending",
        "image": None,
    },
    {
        "id": 2,
        "name": "Learn Flask",
        "description": "",
        "status": "completed",
        "image": None,
    },
]

def save_image(image: UploadFile):
    if not image.filename:
        return None

    extension = image.filename.rsplit(".", 1)[-1].lower()

    if "." not in image.filename or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image type. Use JPG, JPEG or PNG.",
        )

    filename = f"{uuid4().hex}.{extension}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(image.file.read())

    return f"/uploads/{filename}"

def remove_image(image_url):
    if not image_url:
        return

    filename = os.path.basename(image_url)
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if os.path.isfile(file_path):
        os.remove(file_path)



@app.get("/")
def home():
    return {
        "message": "Hello, World! Welcome to FastAPI Backend."
    }

@app.get("/items")
def get_items():
    return items

@app.post("/items")
def create_items(
    name: str = Form(...),
    description: str = Form(""),
    status: str = Form("pending"),
    image: UploadFile | None = File(None),
):
    if not name.strip():
        raise HTTPException(
            status_code=400,
            detail="Task name is required",
        )

    if status not in {"pending", "completed"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid status",
        )

    image_url = None

    if image and image.filename:
        image_url = save_image(image)

    new_id = max(
        (item["id"] for item in items),
        default=0,
    ) + 1

    new_item = {
        "id": new_id,
        "name": name.strip(),
        "description": description,
        "status": status,
        "image": image_url,
    }

    items.append(new_item)

    return new_item


@app.put("/items/{id}")
def update_items(
    id: int,
    name: str | None = Form(None),
    description: str | None = Form(None),
    status: str | None = Form(None),
    image: UploadFile | None = File(None),
):
    item = next(
        (item for item in items if item["id"] == id),
        None,
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    if name is not None:
        if not name.strip():
            raise HTTPException(
                status_code=400,
                detail="Task name cannot be empty",
            )

        item["name"] = name.strip()

    if description is not None:
        item["description"] = description

    if status is not None:
        if status not in {"pending", "completed"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid status",
            )

        item["status"] = status

    if image and image.filename:
        old_image_url = item["image"]

        new_image_url = save_image(image)

        item["image"] = new_image_url

        if old_image_url:
            remove_image(old_image_url)

    return item


@app.delete("/items/{id}")
def delete_items(id: int):
    item = next(
        (item for item in items if item["id"] == id),
        None,
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    if item["image"]:
        remove_image(item["image"])

    items.remove(item)

    return {
        "message": "Item deleted successfully"
    }

@app.get("/uploads/{filename}")
def get_uploaded_image(filename: str):
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="Image not found",
        )

    return FileResponse(file_path)
