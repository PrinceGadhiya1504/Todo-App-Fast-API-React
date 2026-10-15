import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "./components/ui/textarea";
import { Eye, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);

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
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Todo List
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize your work and keep track of your tasks.
          </p>
        </header>

        <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <CardTitle className="text-lg">
              {editId !== null ? "Update Task" : "Add a New Task"}
            </CardTitle>
            <p className="text-sm text-slate-500">
              Enter your task details below.
            </p>
          </CardHeader>

          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  className="h-10"
                  placeholder="Enter your task"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  className="h-10 w-full min-w-0 rounded-md border border-input bg-transparent text-sm
                  file:mr-3 file:h-full file:rounded-md file:border-0
                  file:bg-slate-100 file:px-3 file:py-0
                  hover:file:bg-slate-200"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </div>

              <Textarea
                className="min-h-24 w-full resize-y"
                placeholder="Add a description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>
                  {loading
                    ? "Saving..."
                    : editId !== null
                      ? "Update Task"
                      : "Add Task"}
                </Button>

                {editId !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Tasks</h2>
              <p className="mt-1 text-sm text-slate-500">
                Here are all your tasks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                Total: {items.length}
              </span>

              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                Completed: {completedCount}
              </span>

              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                Pending: {pendingCount}
              </span>
            </div>
          </div>

          {items.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center px-4 py-12 text-center">
                <p className="font-semibold text-slate-800">No tasks yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first task using the form above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="gap-0 overflow-hidden border-slate-200 py-0 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:gap-4">
                      <div className="flex justify-center pt-1">
                        <Checkbox
                          checked={item.status === "completed"}
                          onCheckedChange={() => toggleStatus(item)}
                          aria-label={`Mark ${item.name} as ${
                            item.status === "completed"
                              ? "pending"
                              : "completed"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`break-words font-semibold ${
                              item.status === "completed"
                                ? "text-slate-400 line-through"
                                : "text-slate-900"
                            }`}
                          >
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="col-start-2 flex flex-wrap items-start gap-2 border-t border-slate-100 pt-3 sm:col-start-3 sm:row-start-1 sm:flex-nowrap sm:justify-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Dialog
          open={selectedItem !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedItem(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="break-words pr-6 text-xl">
                    {selectedItem.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      Task #{selectedItem.id}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        selectedItem.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {selectedItem.status === "completed"
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Description
                    </h4>

                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {selectedItem.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Attached Image
                    </h4>

                    {selectedItem.image ? (
                      <img
                        src={`${API_URL}${selectedItem.image}`}
                        alt={selectedItem.name}
                        className="max-h-80 w-full rounded-lg border border-slate-200 object-contain"
                      />
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                        No image attached.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
