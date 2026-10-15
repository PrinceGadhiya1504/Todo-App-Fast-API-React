import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "./components/ui/textarea";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/items`);
      if (!response.ok) {
        throw new Error("failed to fetch todos");
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Todos load nahi hue. Flask server check karo.");
    }
  };

  const completedCount = items.filter(
    (item) => item.status === "completed",
  ).length;
  const pendingCount = items.filter((item) => item.status === "pending").length;

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    if (editId === null) {
      formData.append("status", "pending");
    }
    if (file) formData.append("image", file);

    const isEditItem = editId !== null;

    const url = isEditItem ? `${API_URL}/items/${editId}` : `${API_URL}/items`;

    try {
      setLoading(true);

      const response = await fetch(url, {
        method: isEditItem ? "PUT" : "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add todo");
      }

      resetForm();
      await fetchItems();
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Todos load nahi hue. Flask server check karo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === "pending" ? "completed" : "pending";
    const formData = new FormData();
    formData.append("status", newStatus);

    try {
      const response = await fetch(`${API_URL}/items/${item.id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update status");
      }

      await fetchItems();
    } catch (error) {
      console.error("Status error:", error);
      alert(error.message || "Status update nahi hua");
    }
  };

  const deleteItem = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this todo?",
    );

    if (!confirmed) return;
    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete todo");
      }

      await fetchItems();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message || "Todo delete nahi hua");
    }
  };

  const editItem = (item) => {
    setEditId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setFile(null);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditId(null);
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">My Todo List</h1>
        </header>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-bold">{items.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {completedCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">
                {pendingCount}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Add a new task</CardTitle>
            <CardDescription>
              What do you want to accomplish today?
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-2">
              <Input
                placeholder="Enter your task"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                placeholder="Add description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                ref={fileInputRef}
                type="file"
                alt="Image"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editId !== null
                    ? "Update Item"
                    : "Add Item"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>{pendingCount} tasks remaining</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No items yet. Add your first item!
              </p>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        className="mt-1"
                        checked={item.status === "completed"}
                        onCheckedChange={() => toggleStatus(item)}
                      />

                      <div className="min-w-0 flex-1 space-y-2">
                        <h3
                          className={`break-words text-base font-semibold ${
                            item.status === "completed"
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {item.name}
                        </h3>

                        {item.description && (
                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                            {item.description}
                          </p>
                        )}

                        {item.image && (
                          <img
                            src={`${API_URL}${item.image}`}
                            alt={item.name}
                            className="max-h-64 w-full rounded-lg border object-cover sm:max-w-sm"
                          />
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editItem(item)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
