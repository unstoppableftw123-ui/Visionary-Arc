import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { AuthContext, API } from "../App";
import Sidebar from "../components/Sidebar";
import { toast } from "sonner";
import { 
  Plus, 
  Gift, 
  ShoppingBag, 
  Link as LinkIcon,
  ExternalLink,
  Check,
  Users,
  DollarSign,
  Trash2
} from "lucide-react";

export default function Wishlists() {
  const { user, token } = useContext(AuthContext);
  const [wishlists, setWishlists] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [selectedWishlist, setSelectedWishlist] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Wishlist form
  const [wishlistName, setWishlistName] = useState("");
  const [wishlistDescription, setWishlistDescription] = useState("");
  const [wishlistOpen, setWishlistOpen] = useState(false);
  
  // Item form
  const [itemTitle, setItemTitle] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [itemOpen, setItemOpen] = useState(false);
  
  // Exchange form
  const [exchangeName, setExchangeName] = useState("");
  const [exchangeDescription, setExchangeDescription] = useState("");
  const [exchangeBudget, setExchangeBudget] = useState("");
  const [exchangeOpen, setExchangeOpen] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wishlistsRes, exchangesRes] = await Promise.all([
        axios.get(`${API}/wishlists`, { headers, withCredentials: true }),
        axios.get(`${API}/exchanges`, { headers, withCredentials: true })
      ]);
      setWishlists(wishlistsRes.data);
      setExchanges(exchangesRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWishlist = async () => {
    if (!wishlistName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const response = await axios.post(`${API}/wishlists`, {
        name: wishlistName,
        description: wishlistDescription
      }, { headers, withCredentials: true });
      
      setWishlists([...wishlists, response.data]);
      setWishlistName("");
      setWishlistDescription("");
      setWishlistOpen(false);
      toast.success("Wishlist created!");
    } catch (error) {
      toast.error("Failed to create wishlist");
    }
  };

  const handleSelectWishlist = async (wishlistId) => {
    try {
      const response = await axios.get(`${API}/wishlists/${wishlistId}`, { headers, withCredentials: true });
      setSelectedWishlist(response.data);
    } catch (error) {
      toast.error("Failed to load wishlist");
    }
  };

  const handleAddItem = async () => {
    if (!itemTitle.trim() || !selectedWishlist) {
      toast.error("Title is required");
      return;
    }

    try {
      const response = await axios.post(`${API}/wishlists/items`, {
        wishlist_id: selectedWishlist.wishlist_id,
        title: itemTitle,
        url: itemUrl || null,
        price: itemPrice ? parseFloat(itemPrice) : null,
        notes: itemNotes || null
      }, { headers, withCredentials: true });
      
      setSelectedWishlist({
        ...selectedWishlist,
        items: [...(selectedWishlist.items || []), response.data]
      });
      setItemTitle("");
      setItemUrl("");
      setItemPrice("");
      setItemNotes("");
      setItemOpen(false);
      toast.success("Item added!");
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleMarkPurchased = async (itemId) => {
    try {
      await axios.post(`${API}/wishlists/items/${itemId}/purchase`, {}, { headers, withCredentials: true });
      
      setSelectedWishlist({
        ...selectedWishlist,
        items: selectedWishlist.items.map(item =>
          item.item_id === itemId ? { ...item, purchased: true, purchased_by: user.user_id } : item
        )
      });
      toast.success("Marked as purchased!");
    } catch (error) {
      toast.error("Failed to mark as purchased");
    }
  };

  const handleCreateExchange = async () => {
    if (!exchangeName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const response = await axios.post(`${API}/exchanges`, {
        name: exchangeName,
        description: exchangeDescription,
        budget: exchangeBudget ? parseFloat(exchangeBudget) : null
      }, { headers, withCredentials: true });
      
      setExchanges([...exchanges, response.data]);
      setExchangeName("");
      setExchangeDescription("");
      setExchangeBudget("");
      setExchangeOpen(false);
      toast.success("Exchange created!");
    } catch (error) {
      toast.error("Failed to create exchange");
    }
  };

  const handleSelectExchange = async (exchangeId) => {
    try {
      const response = await axios.get(`${API}/exchanges/${exchangeId}`, { headers, withCredentials: true });
      setSelectedExchange(response.data);
    } catch (error) {
      toast.error("Failed to load exchange");
    }
  };

  const handleJoinExchange = async (exchangeId) => {
    try {
      await axios.post(`${API}/exchanges/${exchangeId}/join`, {}, { headers, withCredentials: true });
      fetchData();
      toast.success("Joined exchange!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join exchange");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto" data-testid="wishlists-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold mb-1">Wishlists & Exchanges</h1>
          <p className="text-muted-foreground">Create wishlists and organize gift exchanges</p>
        </div>

        <Tabs defaultValue="wishlists">
          <TabsList className="mb-6">
            <TabsTrigger value="wishlists" data-testid="wishlists-tab">
              <Gift className="w-4 h-4 mr-2" /> My Wishlists
            </TabsTrigger>
            <TabsTrigger value="exchanges" data-testid="exchanges-tab">
              <Users className="w-4 h-4 mr-2" /> Gift Exchanges
            </TabsTrigger>
          </TabsList>

          {/* Wishlists Tab */}
          <TabsContent value="wishlists">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Wishlist List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-medium">Your Wishlists</h2>
                  <Dialog open={wishlistOpen} onOpenChange={setWishlistOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="create-wishlist-btn">
                        <Plus className="w-4 h-4 mr-2" /> New
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Wishlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={wishlistName}
                            onChange={(e) => setWishlistName(e.target.value)}
                            placeholder="Birthday Wishlist"
                            data-testid="wishlist-name-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description (optional)</Label>
                          <Textarea
                            value={wishlistDescription}
                            onChange={(e) => setWishlistDescription(e.target.value)}
                            placeholder="Add a description..."
                          />
                        </div>
                        <Button onClick={handleCreateWishlist} className="w-full" data-testid="save-wishlist-btn">
                          Create Wishlist
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {wishlists.map((wishlist) => (
                  <motion.div
                    key={wishlist.wishlist_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className={`border-border cursor-pointer transition-all hover:shadow-soft ${
                        selectedWishlist?.wishlist_id === wishlist.wishlist_id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleSelectWishlist(wishlist.wishlist_id)}
                      data-testid={`wishlist-${wishlist.wishlist_id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                            <Gift className="w-5 h-5 text-pink-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{wishlist.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {wishlist.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {wishlists.length === 0 && (
                  <Card className="border-border border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">No wishlists yet</p>
                      <Button onClick={() => setWishlistOpen(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Create one
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Wishlist Details */}
              <div className="lg:col-span-2">
                {selectedWishlist ? (
                  <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="font-heading">{selectedWishlist.name}</CardTitle>
                        {selectedWishlist.description && (
                          <p className="text-sm text-muted-foreground mt-1">{selectedWishlist.description}</p>
                        )}
                      </div>
                      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="add-item-btn">
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Item</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Item Name</Label>
                              <Input
                                value={itemTitle}
                                onChange={(e) => setItemTitle(e.target.value)}
                                placeholder="What do you want?"
                                data-testid="item-title-input"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Link (optional)</Label>
                              <Input
                                value={itemUrl}
                                onChange={(e) => setItemUrl(e.target.value)}
                                placeholder="https://..."
                                data-testid="item-url-input"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Price (optional)</Label>
                              <Input
                                type="number"
                                value={itemPrice}
                                onChange={(e) => setItemPrice(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Notes (optional)</Label>
                              <Textarea
                                value={itemNotes}
                                onChange={(e) => setItemNotes(e.target.value)}
                                placeholder="Size, color, preferences..."
                              />
                            </div>
                            <Button onClick={handleAddItem} className="w-full" data-testid="save-item-btn">
                              Add Item
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedWishlist.items?.map((item) => (
                          <div 
                            key={item.item_id}
                            className={`p-4 rounded-lg border border-border ${item.purchased ? 'bg-green-50 dark:bg-green-900/20' : 'bg-secondary/30'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.title}
                                  </span>
                                  {item.purchased && (
                                    <Badge variant="secondary" className="tag-green">
                                      Purchased
                                    </Badge>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                  {item.price && (
                                    <span className="text-sm flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" /> {item.price.toFixed(2)}
                                    </span>
                                  )}
                                  {item.url && (
                                    <a 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View
                                    </a>
                                  )}
                                </div>
                              </div>
                              {!item.purchased && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleMarkPurchased(item.item_id)}
                                  data-testid={`mark-purchased-${item.item_id}`}
                                >
                                  <Check className="w-4 h-4 mr-2" /> Mark Purchased
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}

                        {(!selectedWishlist.items || selectedWishlist.items.length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            No items yet. Add something you want!
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border border-dashed h-full">
                    <CardContent className="flex items-center justify-center h-full py-16">
                      <div className="text-center">
                        <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Select a wishlist to view items</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Exchanges Tab */}
          <TabsContent value="exchanges">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-medium">Your Gift Exchanges</h2>
                <Dialog open={exchangeOpen} onOpenChange={setExchangeOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="create-exchange-btn">
                      <Plus className="w-4 h-4 mr-2" /> Create Exchange
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Gift Exchange</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Exchange Name</Label>
                        <Input
                          value={exchangeName}
                          onChange={(e) => setExchangeName(e.target.value)}
                          placeholder="Secret Santa 2025"
                          data-testid="exchange-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea
                          value={exchangeDescription}
                          onChange={(e) => setExchangeDescription(e.target.value)}
                          placeholder="Add details about the exchange..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Budget (optional)</Label>
                        <Input
                          type="number"
                          value={exchangeBudget}
                          onChange={(e) => setExchangeBudget(e.target.value)}
                          placeholder="25.00"
                        />
                      </div>
                      <Button onClick={handleCreateExchange} className="w-full" data-testid="save-exchange-btn">
                        Create Exchange
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exchanges.map((exchange) => (
                  <motion.div
                    key={exchange.exchange_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className="border-border hover:shadow-soft transition-shadow cursor-pointer"
                      onClick={() => handleSelectExchange(exchange.exchange_id)}
                      data-testid={`exchange-${exchange.exchange_id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-600/10 dark:bg-orange-600/10 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{exchange.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {exchange.description || "No description"}
                            </p>
                            {exchange.budget && (
                              <Badge variant="secondary" className="mt-2">
                                <DollarSign className="w-3 h-3 mr-1" /> {exchange.budget} budget
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {exchanges.length === 0 && (
                  <Card className="border-border border-dashed md:col-span-2 lg:col-span-3">
                    <CardContent className="py-12 text-center">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No gift exchanges yet</p>
                      <Button onClick={() => setExchangeOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Create your first exchange
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Exchange Details Modal */}
              {selectedExchange && (
                <Card className="border-border mt-6">
                  <CardHeader>
                    <CardTitle className="font-heading">{selectedExchange.name}</CardTitle>
                    {selectedExchange.description && (
                      <p className="text-muted-foreground">{selectedExchange.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      {selectedExchange.budget && (
                        <Badge variant="secondary">
                          Budget: ${selectedExchange.budget}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {selectedExchange.participants?.length || 0} participants
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium mb-3">Participants</h4>
                    <div className="space-y-2">
                      {selectedExchange.users?.map((participant) => (
                        <div 
                          key={participant.user_id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {participant.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{participant.name}</span>
                          {selectedExchange.owner_id === participant.user_id && (
                            <Badge variant="secondary" className="ml-auto">Organizer</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
