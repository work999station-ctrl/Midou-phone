import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useLanguageStore } from '../features/language/store/useLanguageStore';
import { brandModels } from '../data/devicesData';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getApiUrl } from '../config/api';

const MOCK_PRODUCTS = [
  {
    _id: 'mock-shop-1',
    name: 'iPhone 13 Pro - 256GB',
    category: 'Smartphones',
    condition: 'Refurbished',
    price: 649,
    detail: 'Graphite • 100% Battery Health',
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDZVi2SmmR-CQKCEMqeumV_nq50y2QXal5Z4acw0rVhI0x9jl9ulagfTse2iPrp8g-DT4ISUWG7Ps99lFNiHyeqDJ3yEIzBOL5p5fqwpUX7EsqEBNxdbIPwN7s5EOJZBQ8A2WcM8192ZQUVfs4JHIAUXXY0qiYUk6ROS2ExjTPDDnYd-LM7d1Sld6tZS8lg8uoj0qnGoB-htlhwK4vndy8XMd8qrnTiRJzTFQdr4WhccFgQBitewgZ01opyVBE0HCAbEJdatbcznpM']
  },
  {
    _id: 'mock-shop-2',
    name: 'Nokia 3310 (2020)',
    category: 'Feature Phones',
    condition: 'New',
    price: 49,
    detail: 'Dark Blue • Dual SIM • 4G',
    images: ['/feature_phone.png']
  },
  {
    _id: 'mock-shop-3',
    name: 'Apple Watch Series 7 45mm',
    category: 'Wearables',
    condition: 'Refurbished',
    price: 249,
    detail: 'Midnight Aluminum • Sport Band',
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBIiQ5fnGbQ_JGV_hwcSPI4XMYl7C64_7iJoZ8MfpJyj7zrHKMip29ZYxv97v4yeMDRA5BlfckIs2TJqwN0PbyHvNjCN4MfwZuCWlo1HQhQNzcYZ4nQJRVEgNEgzck2bwzSLfst_Nsd3sgXu78fV1AwaPCOEK1RmzS66SAKSh124o_AxbU7WzfBcbthGFmrU4K6e89exXVdrA6S5j4RIdfvhvKX_xih7mG41FIojQvciNJWxi1rIH4AE_9dfSz6RS11BStWFlm6yDQ']
  }
];

export default function Shop() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t, lang } = useLanguageStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileCategories, setShowMobileCategories] = useState(!searchParams.get('category'));
  const [showAccessoriesDropdown, setShowAccessoriesDropdown] = useState(false);
  const [conditions, setConditions] = useState({
    New: true,
    'Used Like New': true,
    Used: true
  });
  const [sortBy, setSortBy] = useState('Latest');

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'All': return t('allProducts', 'All Products');
      case 'Smartphones': return t('categorySmartphones', 'Smartphones');
      case 'Feature Phones': return t('categoryFeaturePhones', 'Feature Phones');
      case 'Tablets': return t('categoryTablets', 'Tablets');
      case 'Accessories': return t('categoryAccessories', 'Accessories');
      case 'Wearables': return t('categoryWearables', 'Wearables');
      case 'Audio': return t('categoryAudio', 'Audio');
      case 'Tools': return t('categoryTools', 'Tools');
      default: return cat;
    }
  };

  const getConditionLabel = (cond) => {
    switch (cond) {
      case 'New': return t('conditionNew', 'New');
      case 'Used Like New': return t('conditionUsedLikeNew', 'Used Like New');
      case 'Used': return t('conditionUsed', 'Used');
      case 'Refurbished': return t('conditionRefurbished', 'Refurbished');
      default: return cond;
    }
  };

  // Mobile category grid cards with photos
  const mobileCategoryCards = [
    { name: 'All', label: getCategoryLabel('All'), image: '/categories/all.png' },
    { name: 'Smartphones', label: getCategoryLabel('Smartphones'), image: '/categories/smartphones.png' },
    { name: 'Feature Phones', label: getCategoryLabel('Feature Phones'), image: '/categories/feature-phones.png' },
    { name: 'Tablets', label: getCategoryLabel('Tablets'), image: '/categories/tablets.png' },
    { name: 'Accessories', label: getCategoryLabel('Accessories'), image: '/categories/accessories.png' },
    { name: 'Wearables', label: getCategoryLabel('Wearables'), image: '/categories/wearables.png' },
  ];

  const handleMobileCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setShowMobileCategories(false);
    setSearchParams({ category: categoryName });
  };

  // New product form states
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Dynamic bottom offset for fixed sidebar to stop right above footer
  const [sidebarBottom, setSidebarBottom] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const footerEl = document.querySelector('footer');
      if (!footerEl) return;
      const rect = footerEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.top < viewportHeight) {
        setSidebarBottom(Math.max(0, viewportHeight - rect.top));
      } else {
        setSidebarBottom(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Synchronize category state when searchParams / URL changes (e.g. Back button)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setShowMobileCategories(false);
      
      // Auto expand accessories dropdown if category is an accessory type
      const isAcc = ['accessories', 'headphones', 'charger', 'cable', 'charger-cable', 'case', 'screen-protector'].includes(categoryParam.toLowerCase());
      if (isAcc) {
        setShowAccessoriesDropdown(true);
      }
    } else {
      setSelectedCategory('All');
      setShowMobileCategories(true);
    }
  }, [searchParams]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'phone',
    condition: 'New',
    price: '',
    stock: '1',
    isAvailable: true,
    images: [],
    specs: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [parsedSpecs, setParsedSpecs] = useState([]);
  
  // Admin dropdown menu active state
  const [activeAdminMenuId, setActiveAdminMenuId] = useState(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveAdminMenuId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // AI Auto-Fill specs & description state & handler
  const [isGeneratingAiSpecs, setIsGeneratingAiSpecs] = useState(false);
  const [hasAiAutoFilled, setHasAiAutoFilled] = useState(false);
  const [aiSpecsError, setAiSpecsError] = useState(null);

  const handleAiAutoFillSpecs = async () => {
    if (hasAiAutoFilled) return;
    if (!newProduct.name || newProduct.name.trim().length < 2) {
      setAiSpecsError('Please type a Product Name first (e.g. Poco X3 Pro or Samsung S24).');
      return;
    }

    setIsGeneratingAiSpecs(true);
    setAiSpecsError(null);

    try {
      const response = await fetch(getApiUrl() + '/api/ai/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: newProduct.name })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to auto-generate specs');
      }

      const data = await response.json();
      const generatedDescription = data.description || '';
      const generatedSpecsText = data.specs || '';

      setNewProduct((prev) => ({
        ...prev,
        description: generatedDescription || prev.description,
        specs: generatedSpecsText || prev.specs
      }));

      if (generatedSpecsText) {
        setParsedSpecs(parseSpecsText(generatedSpecsText));
      }
      setHasAiAutoFilled(true);
    } catch (err) {
      console.error('[AI Auto-Fill Error]', err.message);
      setAiSpecsError(err.message);
    } finally {
      setIsGeneratingAiSpecs(false);
    }
  };

  // Parse specs string into [{key, value}] for card rendering
  const parseSpecsText = (text) => {
    if (!text || !text.trim()) return [];
    return text.split('\n')
      .map(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) return null;
        return {
          key: line.substring(0, colonIdx).trim(),
          value: line.substring(colonIdx + 1).trim()
        };
      })
      .filter(item => item && item.key && item.value);
  };

  // Sync parsedSpecs when specs text is manually edited
  const handleSpecsChange = (val) => {
    setNewProduct(prev => ({ ...prev, specs: val }));
    setParsedSpecs(parseSpecsText(val));
  };

  const [imageError, setImageError] = useState(null);

  const compressClientImage = (file, maxDim = 400, quality = 0.65) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageError(null);

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setImageError('Please select valid image files.');
        continue;
      }

      try {
        const compressedBase64 = await compressClientImage(file);
        setNewProduct((prev) => ({
          ...prev,
          images: [...prev.images, compressedBase64]
        }));
      } catch (err) {
        console.error('Image compression error:', err);
      }
    }

    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
    setImageError(null);
  };


  // Flattened device list for autocompletion
  const [allModels, setAllModels] = useState([]);
  useEffect(() => {
    if (brandModels) {
      const flattened = Object.values(brandModels).flatMap(categoryObj => 
        Object.values(categoryObj).flat()
      );
      setAllModels([...new Set(flattened)]);
    }
  }, []);

  const [nameAutocompletes, setNameAutocompletes] = useState([]);
  const [showAutocompleteDropdown, setShowAutocompleteDropdown] = useState(false);

  const handleNameChange = (val) => {
    setNewProduct(prev => ({ ...prev, name: val }));
    
    if (val.trim().length >= 2) {
      const filtered = allModels.filter(model => 
        model.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setNameAutocompletes(filtered);
      setShowAutocompleteDropdown(true);
    } else {
      setNameAutocompletes([]);
      setShowAutocompleteDropdown(false);
    }
  };

  const selectAutocompleteModel = (modelName) => {
    setNewProduct(prev => {
      let detectedCategory = prev.category;
      
      for (const [brand, categoriesObj] of Object.entries(brandModels)) {
        for (const [catName, modelsList] of Object.entries(categoriesObj)) {
          if (modelsList.includes(modelName)) {
            const lowerCat = catName.toLowerCase();
            if (lowerCat.includes('tablet')) {
              detectedCategory = 'tablet';
            } else if (lowerCat.includes('watch') || lowerCat.includes('wearable')) {
              detectedCategory = 'watch';
            } else if (lowerCat.includes('classic') || lowerCat.includes('feature')) {
              detectedCategory = 'feature-phone';
            } else {
              detectedCategory = 'phone';
            }
            break;
          }
        }
      }

      return { 
        ...prev, 
        name: modelName,
        category: detectedCategory
      };
    });
    setNameAutocompletes([]);
    setShowAutocompleteDropdown(false);
  };

  const getSpecsSuggestions = () => {
    const nameLower = newProduct.name.toLowerCase();
    const category = newProduct.category;

    if (category === 'phone' || category === 'tablet') {
      if (nameLower.includes('iphone') || nameLower.includes('ipad')) {
        return [
          { label: '128GB', specsText: 'Storage: 128GB\nBrand: Apple\nOS: iOS' },
          { label: '256GB', specsText: 'Storage: 256GB\nBrand: Apple\nOS: iOS' },
          { label: '512GB', specsText: 'Storage: 512GB\nBrand: Apple\nOS: iOS' },
          { label: '1TB', specsText: 'Storage: 1TB\nBrand: Apple\nOS: iOS' }
        ];
      }
      return [
        { label: '6/128', specsText: 'RAM: 6GB\nStorage: 128GB\nProcessor: Octa-core' },
        { label: '8/256', specsText: 'RAM: 8GB\nStorage: 256GB\nProcessor: Octa-core' },
        { label: '12/256', specsText: 'RAM: 12GB\nStorage: 256GB\nProcessor: Octa-core' },
        { label: '16/512', specsText: 'RAM: 16GB\nStorage: 512GB\nProcessor: Octa-core' }
      ];
    }
    
    if (category === 'feature-phone') {
      return [
        { label: '4MB/8MB', specsText: 'RAM: 4MB\nStorage: 8MB\nNetwork: 2G\nSIM: Single SIM' },
        { label: 'Dual SIM', specsText: 'RAM: 16MB\nStorage: 16MB\nNetwork: 4G\nSIM: Dual SIM' },
        { label: 'Retro Edition', specsText: 'Form Factor: Candybar\nSnake Game: Pre-installed\nBattery: Removable' }
      ];
    }
    
    if (category === 'watch') {
      return [
        { label: 'GPS / 40mm', specsText: 'Size: 40mm\nConnectivity: GPS\nHeart Rate: Yes' },
        { label: 'Cellular / 44mm', specsText: 'Size: 44mm\nConnectivity: GPS + Cellular\nHeart Rate: Yes' },
        { label: 'Ultra / 49mm', specsText: 'Size: 49mm\nMaterial: Titanium\nBattery Life: Up to 36h' }
      ];
    }
    
    if (category === 'headphones') {
      return [
        { label: 'ANC Wireless', specsText: 'Type: Over-Ear\nNoise Cancelling: Active (ANC)\nBattery: 30 hours' },
        { label: 'In-Ear Sport', specsText: 'Type: True Wireless\nWaterproof: IPX7\nBattery: 8 hours' }
      ];
    }
    
    if (category === 'charger') {
      return [
        { label: '20W USB-C', specsText: 'Output: 20W Fast Charge\nPort: USB-C' },
        { label: '65W GaN', specsText: 'Output: 65W GaN Fast Charge\nPorts: 2x USB-C, 1x USB-A' }
      ];
    }
    
    if (category === 'screen-protector') {
      return [
        { label: 'Tempered Glass', specsText: 'Material: 9H Tempered Glass\nThickness: 0.33mm' },
        { label: 'Privacy Filter', specsText: 'Material: Privacy Glass\nAngle: 28-degree visibility' }
      ];
    }
    
    return [];
  };

  const nameSuggestions = getSpecsSuggestions();

  const applySuggestion = (variant) => {
    let updatedName = newProduct.name;
    const suffixes = ['6/128', '8/256', '12/256', '16/512', '128GB', '256GB', '512GB', '1TB', '4MB/8MB', 'Dual SIM', 'Retro Edition', 'GPS / 40mm', 'Cellular / 44mm', 'Ultra / 49mm', 'ANC Wireless', 'In-Ear Sport', '20W USB-C', '65W GaN', 'Tempered Glass', 'Privacy Filter'];
    
    suffixes.forEach(s => {
      updatedName = updatedName.replace(new RegExp(`\\s*-\\s*${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i'), '');
      updatedName = updatedName.replace(new RegExp(`\\s*${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i'), '');
    });
    
    updatedName = `${updatedName} - ${variant.label}`;

    setNewProduct(prev => ({
      ...prev,
      name: updatedName,
      specs: variant.specsText
    }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Parse specs into map
    const specMap = {};
    if (newProduct.specs.trim()) {
      newProduct.specs.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          specMap[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      });
    }

    const payload = {
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      condition: newProduct.condition,
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      images: newProduct.images.length > 0 
        ? newProduct.images 
        : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop'],
      specs: specMap
    };

    try {
      const isEditing = Boolean(editingProductId);
      const url = isEditing
        ? `${getApiUrl()}/api/products/${editingProductId}`
        : `${getApiUrl()}/api/products`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
      }

      const savedProduct = await response.json();

      // Update list: replace when editing, prepend when creating
      setProducts(prev =>
        isEditing
          ? prev.map(p => (p._id === savedProduct._id ? savedProduct : p))
          : [savedProduct, ...prev]
      );

      // Reset form and close modal
      setNewProduct({
        name: '',
        description: '',
        category: 'phone',
        condition: 'New',
        price: '',
        stock: '1',
        images: [],
        specs: ''
      });
      setParsedSpecs([]);
      setImageError(null);
      setIsModalOpen(false);
      setEditingProductId(null);
      setAiSpecsError(null);
      setHasAiAutoFilled(false);
    } catch (err) {
      console.error('Product save error:', err);
      setSubmitError(err.message || 'Network error occurred while saving product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert a product's specs map back into the "key: value" textarea format
  const specsMapToText = (specs) => {
    if (!specs || typeof specs !== 'object') return '';
    return Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  // Open the modal in "create" mode with a clean form
  const openCreateModal = () => {
    setEditingProductId(null);
    setSubmitError(null);
    setImageError(null);
    setAiSpecsError(null);
    setHasAiAutoFilled(false);
    const initialSpecs = 'RAM: \nStorage: \n';
    setNewProduct({
      name: '',
      description: '',
      category: 'phone',
      condition: 'New',
      price: '',
      stock: '1',
      images: [],
      specs: initialSpecs
    });
    setParsedSpecs(parseSpecsText(initialSpecs));
    setShowNewProductModal(true);
  };

  // Open the modal in "edit" mode, prefilled with the product's data
  const openEditModal = (product) => {
    setEditingProductId(product._id);
    setSubmitError(null);
    setImageError(null);
    setAiSpecsError(null);
    setHasAiAutoFilled(false);
    const specsText = specsMapToText(product.specs);
    const rawImages = product.images || (product.image ? [product.image] : []);
    const imagesArray = Array.isArray(rawImages) ? rawImages : [rawImages];
    setNewProduct({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'phone',
      condition: product.condition || 'New',
      price: product.price != null ? String(product.price) : '',
      stock: product.stock != null ? String(product.stock) : '0',
      images: imagesArray.filter(Boolean),
      specs: specsText
    });
    setParsedSpecs(parseSpecsText(specsText));
    setShowNewProductModal(true);
  };

  // Close the modal and reset edit state
  const closeModal = () => {
    setShowNewProductModal(false);
    setEditingProductId(null);
    setSubmitError(null);
    setImageError(null);
    setAiSpecsError(null);
    setHasAiAutoFilled(false);
  };

  // Mark a product as sold by setting its stock to 0
  const [markingSoldId, setMarkingSoldId] = useState(null);
  const handleMarkSold = async (product) => {
    setMarkingSoldId(product._id);
    const newStock = product.stock === 0 ? 1 : 0;
    try {
      const response = await fetch(`${getApiUrl()}/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update product');
      }
      const updated = await response.json();
      setProducts(prev => prev.map(p => (p._id === updated._id ? updated : p)));
    } catch (err) {
      console.error('Mark sold error:', err.message);
    } finally {
      setMarkingSoldId(null);
    }
  };

  // Toggle isAvailable boolean (Mark Available / Mark Not Available)
  const [togglingAvailabilityId, setTogglingAvailabilityId] = useState(null);
  const handleToggleAvailability = async (product) => {
    setTogglingAvailabilityId(product._id);
    const newAvailable = product.isAvailable === false ? true : false;
    try {
      const response = await fetch(`${getApiUrl()}/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newAvailable })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update product availability');
      }
      const updated = await response.json();
      setProducts(prev => prev.map(p => (p._id === updated._id ? updated : p)));
    } catch (err) {
      console.error('Toggle availability error:', err.message);
    } finally {
      setTogglingAvailabilityId(null);
    }
  };

  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const onRequestDeleteProduct = (e, product) => {
    e.stopPropagation();
    setDeleteConfirmProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    const product = deleteConfirmProduct;
    setDeletingId(product._id);
    try {
      const response = await fetch(`${getApiUrl()}/api/products/${product._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete product');
      }
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      setDeleteConfirmProduct(null);
    } catch (err) {
      console.error('Delete product error:', err.message);
    } finally {
      setDeletingId(null);
    }
  };
  useEffect(() => {
    fetch(getApiUrl() + '/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
        setLoading(false);
      })
      .catch(() => {
        setProducts(MOCK_PRODUCTS);
        setLoading(false);
      });
  }, []);

  const handleConditionChange = (condition) => {
    setConditions((prev) => ({
      ...prev,
      [condition]: !prev[condition]
    }));
  };

  const categories = [
    { name: 'All', icon: 'grid_view' },
    { name: 'Smartphones', icon: 'smartphone' },
    { name: 'Feature Phones', icon: 'dialpad' },
    { name: 'Tablets', icon: 'tablet_mac' },
    { name: 'Wearables', icon: 'watch' },
    { name: 'Accessories', icon: 'cable' }
  ];

  const accessorySubcategories = [
    { name: 'All Accessories', value: 'Accessories', icon: 'category' },
    { name: 'Headphones & Audio', value: 'headphones', icon: 'headphones' },
    { name: 'Chargers & Cables', value: 'charger-cable', icon: 'bolt' },
    { name: 'Cases & Covers', value: 'case', icon: 'phone_android' },
    { name: 'Screen Protectors', value: 'screen-protector', icon: 'screen_lock_portrait' }
  ];

  // Filtering products
  const filteredProducts = products.filter((item) => {
    // 0. Filter by search query (product name)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      if (!item.name || !item.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    // 1. Filter by Category
    if (selectedCategory !== 'All') {
      const cat = (item.category || '').toLowerCase().trim();
      const sel = selectedCategory.toLowerCase().trim();
      
      if (sel === 'smartphones') {
        const isSmart = cat === 'phone' || cat === 'smartphone' || cat === 'smartphones' || (cat.includes('phone') && !cat.includes('feature') && !cat.includes('head'));
        if (!isSmart) return false;
      } else if (sel === 'feature phones') {
        const isFeature = cat.includes('feature');
        if (!isFeature) return false;
      } else if (sel === 'tablets') {
        const isTablet = cat.includes('tab');
        if (!isTablet) return false;
      } else if (sel === 'wearables') {
        const isWear = cat.includes('watch') || cat.includes('wear');
        if (!isWear) return false;
      } else if (sel === 'accessories') {
        const isAccessory = cat.includes('charg') || cat.includes('protect') || cat.includes('glass') || cat.includes('cable') || cat.includes('case') || cat.includes('access') || cat.includes('head') || cat.includes('audio') || cat.includes('sound') || cat.includes('cover');
        if (!isAccessory) return false;
      } else if (sel === 'headphones') {
        const isAudio = cat.includes('head') || cat.includes('audio') || cat.includes('sound');
        if (!isAudio) return false;
      } else if (sel === 'charger-cable') {
        const isChargerOrCable = cat.includes('charg') || cat.includes('cable');
        if (!isChargerOrCable) return false;
      } else if (sel === 'case') {
        const isCase = cat.includes('case') || cat.includes('cover');
        if (!isCase) return false;
      } else if (sel === 'screen-protector') {
        const isProtector = cat.includes('protect') || cat.includes('glass');
        if (!isProtector) return false;
      } else if (cat !== sel) {
        return false;
      }
    }

    // 2. Filter by Condition
    const condKey = item.condition;
    if (conditions[condKey] === false) {
      return false;
    }

    return true;
  });

  // Sorting products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Price: Low to High') {
      return a.price - b.price;
    }
    if (sortBy === 'Price: High to Low') {
      return b.price - a.price;
    }
    // Default: Latest
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="flex flex-1 pt-20 bg-background text-on-surface min-h-[90vh]">
      {/* SideNavBar - Fixed to screen, dynamically stops above footer */}
      <aside 
        className="hidden md:flex flex-col w-64 fixed top-20 left-0 z-30 bg-surface-container-lowest/95 dark:bg-surface-container-lowest/95 backdrop-blur-xl border-r border-white/5 py-6 overflow-y-auto"
        style={{ bottom: `${sidebarBottom}px` }}
      >
        <div className="px-6 mb-6">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-1">{t('categories', 'Categories')}</h2>
          <p className="font-body-sm text-label-sm text-on-surface-variant">{t('browseInventory', 'Browse Inventory')}</p>
        </div>
        
        <nav className="flex-grow space-y-1">
          {categories.map((cat) => {
            const isAccessories = cat.name === 'Accessories';
            const isAccActive = ['accessories', 'headphones', 'charger', 'cable', 'case', 'screen-protector'].includes(selectedCategory.toLowerCase());
            const isActive = isAccessories ? isAccActive : (selectedCategory === cat.name);

            return (
              <div key={cat.name} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => {
                    if (isAccessories) {
                      setShowAccessoriesDropdown(!showAccessoriesDropdown);
                      setSelectedCategory('Accessories');
                      setSearchParams({ category: 'Accessories' });
                    } else {
                      setSelectedCategory(cat.name);
                      setSearchParams(cat.name === 'All' ? {} : { category: cat.name });
                    }
                  }}
                  className={`w-full flex items-center justify-between px-6 py-3 font-label-md text-label-md transition-all cursor-pointer text-left border-none bg-transparent outline-none ${
                    isActive
                      ? 'bg-secondary/10 text-secondary border-r-4 border-secondary font-bold'
                      : 'text-on-surface-variant hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-stack-md">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: `"FILL" ${isActive ? 1 : 0}` }}>
                      {cat.icon}
                    </span>
                    <span>{getCategoryLabel(cat.name)}</span>
                  </div>
                  {isAccessories && (
                    <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: showAccessoriesDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      expand_more
                    </span>
                  )}
                </button>

                {/* Subcategory Dropdown list */}
                {isAccessories && showAccessoriesDropdown && (
                  <div className="py-1 flex flex-col border-l border-white/5 ml-8 mt-1 space-y-0.5">
                    {accessorySubcategories.map((sub) => {
                      const isSubActive = selectedCategory.toLowerCase() === sub.value.toLowerCase() || (sub.value === 'Accessories' && selectedCategory.toLowerCase() === 'accessories');
                      return (
                        <button
                          key={sub.value}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(sub.value);
                            setSearchParams({ category: sub.value });
                          }}
                          className={`w-full flex items-center gap-2 pl-4 pr-3 py-2 text-xs font-semibold transition-colors cursor-pointer text-left border-none bg-transparent outline-none ${
                            isSubActive
                              ? 'text-secondary font-bold'
                              : 'text-on-surface-variant hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {sub.icon}
                          </span>
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Conditions filter */}
        <div className="px-6 mt-6">
          <h3 className="font-label-md text-label-md text-on-surface-variant mb-3 uppercase tracking-wider">{t('condition', 'Condition')}</h3>
          <div className="space-y-3">
            {Object.keys(conditions).map((cond) => (
              <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={conditions[cond]}
                  onChange={() => handleConditionChange(cond)}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  conditions[cond] 
                    ? 'border-secondary bg-secondary/20 text-secondary' 
                    : 'border-outline group-hover:border-secondary'
                }`}>
                  <span className={`material-symbols-outlined text-[16px] ${conditions[cond] ? 'opacity-100' : 'opacity-0'}`}>
                    check
                  </span>
                </div>
                <span className={`font-body-md text-body-md ${conditions[cond] ? 'text-secondary font-bold' : 'text-on-surface'}`}>
                  {getConditionLabel(cond)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow md:ml-64 p-margin-mobile md:p-margin-desktop">
        <div className="max-w-container-max mx-auto">

          {/* ─── Mobile Categories Grid Landing (shown on mobile when no category selected) ─── */}
          <div className={`md:hidden ${showMobileCategories ? 'block' : 'hidden'}`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-on-surface mb-1">{t('categories', 'Categories')}</h1>
                <p className="text-sm text-on-surface-variant">{t('browseInventory', 'Browse Inventory')}</p>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher compact />
                {isAuthenticated && (
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high border border-white/10 hover:border-secondary/50 text-on-surface hover:text-secondary text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    {t('dashboard', 'Dashboard')}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {mobileCategoryCards.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleMobileCategorySelect(cat.name)}
                  className="group flex flex-col items-center bg-surface-container-low rounded-2xl border border-white/10 overflow-hidden transition-all active:scale-[0.97] hover:border-secondary/40 cursor-pointer"
                >
                  <div className="w-full aspect-square bg-white/95 flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-sm font-bold text-on-surface py-3 text-center">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── Products View (desktop always, mobile after category selection) ─── */}
          <div className={`md:block ${showMobileCategories ? 'hidden' : 'block'}`}>

            {/* Mobile back to categories button */}
            <button
              onClick={() => { setShowMobileCategories(true); setSelectedCategory('All'); setSearchParams({}); }}
              className="md:hidden flex items-center gap-1.5 text-secondary font-bold text-sm mb-4 cursor-pointer bg-transparent border-none"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              {t('backToCategories', 'Back to Categories')}
            </button>

            {/* Dashboard Back Button (above All Products header) */}
            {isAuthenticated && (
              <div className="mb-4">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="inline-flex items-center gap-1.5 bg-surface-container-high border border-white/10 hover:border-secondary/50 text-on-surface hover:text-secondary font-semibold px-3.5 py-1.5 rounded-lg text-sm transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  {t('dashboard', 'Dashboard')}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <div>
                <h1 className="text-xl sm:font-display-lg sm:text-display-lg font-extrabold text-primary mb-1">
                  {getCategoryLabel(selectedCategory)}
                </h1>
                <p className="text-sm sm:font-body-lg sm:text-body-lg text-on-surface-variant">{t('precisionRestored', 'Precision restored. Performance guaranteed.')}</p>
              </div>
              
              <div className="flex gap-2.5 w-full sm:w-auto items-center flex-wrap">
                {isAuthenticated && (
                  <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 bg-secondary text-black font-bold px-3.5 py-2 rounded-lg text-sm hover:bg-secondary/80 transition-colors shadow-lg cursor-pointer border-none outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    {t('createProduct', 'Create Product')}
                  </button>
                )}
                {/* Search input */}
                <div className="relative flex-1 sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder={t('searchProductsPlaceholder', 'Search products...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-container-highest border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                  />
                </div>

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="hidden sm:block bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:border-secondary outline-none text-sm cursor-pointer"
                >
                  <option value="Latest">Latest</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                </select>
              </div>
            </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center my-8">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">search_off</span>
              <p className="text-xl text-on-surface-variant">No items found matching the selected filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {sortedProducts.map((item) => (
                <article 
                  key={item._id}
                  onClick={() => navigate(`/shop/product/${item._id}`)}
                  className="glass-panel rounded-xl p-3 sm:p-6 relative overflow-hidden product-card group flex flex-col h-full cursor-pointer"
                >
                  {/* Admin Three Dots Menu (top-right) */}
                  {isAuthenticated && (
                    <div className="absolute top-2 right-2 z-40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAdminMenuId(activeAdminMenuId === item._id ? null : item._id);
                        }}
                        title="Admin Options"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white hover:text-secondary shadow-lg transition-all duration-200 border-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>

                      {activeAdminMenuId === item._id && (
                        <div className="absolute right-0 mt-1 w-[150px] bg-[#18233c]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
                          {/* Edit Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAdminMenuId(null);
                              openEditModal(item);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 transition-colors text-left border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-secondary">edit</span>
                            <span>Edit Product</span>
                          </button>

                          <div className="border-t border-white/10"></div>

                          {/* Toggle Sold Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAdminMenuId(null);
                              handleMarkSold(item);
                            }}
                            disabled={markingSoldId === item._id}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 transition-colors text-left border-none bg-transparent cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              {item.stock === 0 ? 'check_circle' : 'sell'}
                            </span>
                            <span>{item.stock === 0 ? 'Mark Unsold' : 'Mark Sold'}</span>
                          </button>

                          <div className="border-t border-white/10"></div>

                          {/* Toggle Availability Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAdminMenuId(null);
                              handleToggleAvailability(item);
                            }}
                            disabled={togglingAvailabilityId === item._id}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-on-surface hover:bg-white/5 transition-colors text-left border-none bg-transparent cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              {item.isAvailable === false ? 'check_circle' : 'block'}
                            </span>
                            <span>{item.isAvailable === false ? 'Mark Available' : 'Mark Not Available'}</span>
                          </button>

                          <div className="border-t border-white/10"></div>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAdminMenuId(null);
                              onRequestDeleteProduct(e, item);
                            }}
                            disabled={deletingId === item._id}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Delete Product</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {/* SOLD diagonal ribbon */}
                  {item.stock === 0 && (
                    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden z-30 pointer-events-none">
                      <div className="absolute top-[22px] -left-[34px] w-[160px] -rotate-45 bg-red-600 text-white text-center text-xs font-extrabold tracking-widest uppercase py-1.5 shadow-lg">
                        Sold
                      </div>
                    </div>
                  )}

                  
                  <div className="relative h-36 sm:h-64 w-full mb-3 sm:mb-6 z-10 flex items-center justify-center pt-2 sm:pt-4">
                    {item.images && item.images.length > 1 && (
                      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold z-20 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">collections</span>
                        {item.images.length}
                      </span>
                    )}

                    {/* Horizontal Gray Banner at bottom of image */}
                    {item.isAvailable === false && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#252830]/95 text-gray-200 py-1.5 px-3 text-center text-[11px] font-extrabold tracking-widest uppercase border-t border-gray-600/40 shadow-md z-20 pointer-events-none">
                        Not Available
                      </div>
                    )}

                    <img
                      alt={item.name}
                      className="max-h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                      src={item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop'}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  
                  <div className="z-10 mt-auto">
                    <h3 className="text-sm sm:font-headline-sm sm:text-headline-sm font-bold text-on-surface mb-0.5 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-[10px] sm:text-[12px] font-semibold text-on-surface-variant/70 mb-1.5 flex items-center gap-1.5">
                      <span>{getCategoryLabel(item.category)}</span>
                      <span className="text-secondary font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">•</span>
                      <span className="text-secondary font-bold font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">
                        {item.condition}
                      </span>
                    </p>
                    <p className="text-[11px] sm:font-body-sm sm:text-label-sm text-on-surface-variant mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-3 overflow-hidden text-ellipsis leading-relaxed">
                      {item.detail || item.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 sm:mt-4 border-t border-white/10 pt-2 sm:pt-4">
                      <span className="text-base sm:font-headline-md sm:text-headline-md font-extrabold text-secondary">
                        {item.price}.00 <span className="text-[10px] sm:text-label-sm text-on-surface-variant font-semibold">DA</span>
                      </span>
                    </div>


                  </div>
                </article>
              ))}
            </div>
          )}
          </div> {/* End products view wrapper */}
        </div>
      </main>

      {/* New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 p-6 relative overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/5 pointer-events-none"></div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/10 relative z-10">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">add_box</span> Create New Product
              </h2>
              <button 
                onClick={() => setShowNewProductModal(false)}
                className="text-on-surface-variant hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="space-y-4 py-4 overflow-y-auto relative z-10 flex-grow pr-1">
              {submitError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">
                  {submitError}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowAutocompleteDropdown(false), 200)}
                    className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:border-secondary outline-none text-sm"
                    placeholder="e.g. Poco X3"
                    autoComplete="off"
                  />
                  
                  {/* Floating Autocomplete Dropdown */}
                  {showAutocompleteDropdown && nameAutocompletes.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#151f38] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {nameAutocompletes.map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => selectAutocompleteModel(model)}
                          className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-on-surface transition-colors cursor-pointer border-none bg-transparent"
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:border-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="phone">Smartphones</option>
                    <option value="feature-phone">Feature Phones</option>
                    <option value="tablet">Tablets</option>
                    <option value="watch">Wearables</option>
                    <option value="headphones">Headphones & Audio</option>
                    <option value="charger">Chargers</option>
                    <option value="cable">Cables</option>
                    <option value="case">Cases & Covers</option>
                    <option value="screen-protector">Screen Protectors</option>
                  </select>
                </div>
              </div>

              {/* AI Auto-Fill Specs Banner */}
              <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900/60 border border-purple-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-purple-200">AI Product Specs Auto-Fill</span>
                    <span className="block text-[11px] text-purple-300/70">Type product name and click to auto-fill specs & description using Gemini AI.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiAutoFillSpecs}
                  disabled={isGeneratingAiSpecs || !newProduct.name.trim() || hasAiAutoFilled}
                  className={`w-full sm:w-auto shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-extrabold shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                    hasAiAutoFilled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                  }`}
                >
                  {isGeneratingAiSpecs ? (
                    <>
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5"></span>
                      <span>Auto-Generating...</span>
                    </>
                  ) : hasAiAutoFilled ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                      <span>AI Specs Generated</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      <span>Auto-Fill with AI</span>
                    </>
                  )}
                </button>
              </div>

              {aiSpecsError && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {aiSpecsError}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Condition *</label>
                  <select
                    value={newProduct.condition}
                    onChange={(e) => setNewProduct({ ...newProduct, condition: e.target.value })}
                    className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:border-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Used Like New">Used Like New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Availability *</label>
                  <select
                    value={Number(newProduct.stock) === 0 ? 'Not Available' : 'Available'}
                    onChange={(e) => {
                      const isAvail = e.target.value === 'Available';
                      setNewProduct({ 
                        ...newProduct, 
                        stock: isAvail ? (Number(newProduct.stock) > 0 ? newProduct.stock : '1') : '0' 
                      });
                    }}
                    className={`w-full bg-surface-container-low border rounded-lg px-2.5 py-2 text-sm outline-none cursor-pointer font-bold ${
                      Number(newProduct.stock) === 0 
                        ? 'text-red-400 border-red-500/40' 
                        : 'text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    <option value="Available" className="bg-[#171f33] text-emerald-400 font-bold">Available</option>
                    <option value="Not Available" className="bg-[#171f33] text-red-400 font-bold">Not Available</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Price (DA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:border-secondary outline-none text-sm"
                    placeholder="e.g. 59000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:border-secondary outline-none text-sm"
                    placeholder="e.g. 1"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-on-surface-variant">
                    Product Images ({newProduct.images.length})
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                    Add Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Multi-Image Gallery Preview */}
                {newProduct.images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3 p-3 bg-surface-container-low/60 border border-white/10 rounded-xl max-h-48 overflow-y-auto">
                    {newProduct.images.map((imgSrc, idx) => (
                      <div 
                        key={idx} 
                        className="relative group aspect-square rounded-lg border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center p-1"
                      >
                        <img src={imgSrc} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                        
                        {/* Main Image Badge */}
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-secondary text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                            Main
                          </span>
                        )}

                        {/* Remove Image Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer border-none"
                          title="Remove image"
                        >
                          <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 hover:border-secondary/50 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low transition-all cursor-pointer group text-center">
                    <span className="material-symbols-outlined text-outline group-hover:text-secondary text-[36px] mb-1 transition-colors">
                      add_photo_alternate
                    </span>
                    <span className="text-sm font-semibold text-on-surface group-hover:text-secondary transition-colors">
                      Upload Product Images
                    </span>
                    <span className="text-xs text-on-surface-variant mt-0.5">
                      Click to select one or multiple images from device
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}

                {imageError && (
                  <div className="mt-2 bg-red-500/15 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {imageError}
                  </div>
                )}
              </div>

              
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3.5 py-2.5 text-on-surface focus:border-secondary outline-none text-sm leading-relaxed"
                  placeholder="Describe the product specs, features, condition details..."
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-on-surface-variant">Specs (Key: Value format)</label>
                  <span className="text-xs text-on-surface-variant/70">One spec per line</span>
                </div>

                <textarea
                  rows={10}
                  value={newProduct.specs}
                  onChange={(e) => handleSpecsChange(e.target.value)}
                  className="w-full min-h-[200px] bg-surface-container-low border border-white/10 rounded-lg p-3 text-on-surface focus:border-purple-500 outline-none text-sm font-mono leading-relaxed resize-y text-purple-200/90"
                  placeholder={"Display Type: AMOLED, 120Hz\nDisplay Size: 6.67 inches\nChipset: Snapdragon 860\nRAM: 8GB\nStorage: 256GB\nBattery: 5160 mAh"}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 border border-white/10 text-on-surface-variant hover:text-white rounded-lg text-sm cursor-pointer bg-transparent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-secondary text-black font-bold rounded-lg text-sm cursor-pointer hover:bg-secondary/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-red-500/30 p-6 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/20">
              <span className="material-symbols-outlined text-[32px]">delete_forever</span>
            </div>

            <h3 className="text-xl font-bold text-on-surface mb-2">Delete Product?</h3>
            
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Are you sure you want to delete <span className="text-on-surface font-semibold">"{deleteConfirmProduct.name}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 w-full pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 px-4 bg-surface-container-highest hover:bg-white/10 text-on-surface border border-white/10 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 border-none active:scale-95 disabled:opacity-50"
              >
                {deletingId ? (
                  <>
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
