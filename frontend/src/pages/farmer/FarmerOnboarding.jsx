import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/App';
import { registerFarmer, lookupPincode } from '@/lib/api';
import { toast } from 'sonner';
import { Sprout, User, MapPin, CreditCard, Check, Building, Smartphone, Loader2, Clock, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL || '';

const FarmerOnboarding = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [form, setForm] = useState({
    name: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    address: '', // Full address after PIN code
    aadhaar: '',
    // Bank details
    accountNumber: '',
    ifsc: '',
    accountHolder: '',
    // UPI
    upiId: '',
    paymentPreference: 'upi' // 'upi' or 'bank'
  });

  const cropOptions = ['Rice', 'Pulses', 'Flour', 'Spices', 'Sweeteners', 'Other'];
  const [selectedCrops, setSelectedCrops] = useState([]);

  const toggleCrop = (crop) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter(c => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  // PIN code lookup
  useEffect(() => {
    const lookupPin = async () => {
      if (form.pincode.length === 6) {
        setPincodeLoading(true);
        try {
          const res = await lookupPincode(form.pincode);
          if (!res.data.not_found) {
            setForm(prev => ({
              ...prev,
              city: res.data.city,
              district: res.data.district,
              state: res.data.state
            }));
          }
        } catch (err) {
          console.error('PIN lookup failed:', err);
        }
        setPincodeLoading(false);
      }
    };
    lookupPin();
  }, [form.pincode]);

  // Check for duplicate phone on mount
  useEffect(() => {
    const checkPhone = async () => {
      if (user?.phone) {
        try {
          const res = await fetch(`${API_URL}/api/check-phone/${user.phone}?user_type=farmer`);
          const data = await res.json();
          if (data.exists) {
            setPhoneError(data.message);
          }
        } catch (err) {
          console.error('Phone check failed:', err);
        }
      }
    };
    checkPhone();
  }, [user?.phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.pincode || !form.aadhaar) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.pincode.length !== 6) {
      toast.error('PIN code must be 6 digits');
      return;
    }

    if (form.aadhaar.length !== 12) {
      toast.error('Aadhaar number must be 12 digits');
      return;
    }

    // Payment validation
    if (form.paymentPreference === 'upi' && !form.upiId) {
      toast.error('Please enter UPI ID');
      return;
    }
    if (form.paymentPreference === 'bank' && (!form.accountNumber || !form.ifsc)) {
      toast.error('Please enter bank account details');
      return;
    }

    setLoading(true);
    try {
      const village = form.city || form.district || 'Village';
      const res = await registerFarmer({
        name: form.name,
        village: village,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        crop_types: selectedCrops.length > 0 ? selectedCrops : ['General'],
        aadhaar_last4: form.aadhaar.slice(-4),
        bank_details: form.paymentPreference === 'bank' ? {
          account_number_last4: form.accountNumber.slice(-4),
          ifsc: form.ifsc,
          account_holder: form.accountHolder || form.name
        } : null,
        upi_id: form.paymentPreference === 'upi' ? form.upiId : null
      }, user.phone);

      // Update user context with farmer info
      login({
        ...user,
        isRegisteredFarmer: true,
        farmer: res.data
      });

      toast.success('Welcome to 0middle!');
      navigate('/farmer');
    } catch (err) {
      toast.error('Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_cropconnect-66/artifacts/lhuchfmv_0middle-logo.png" 
            alt="0middle" 
            className="h-14 w-auto mx-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sprout className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="heading-2 text-2xl">Join Empowered Farmers Community</CardTitle>
            <CardDescription className="body-text">
              Quick setup to start selling directly to consumers
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Phone Error Alert */}
            {phoneError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 font-medium">{phoneError}</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-red-600 text-sm"
                    onClick={() => navigate('/farmer/login')}
                  >
                    Click here to login instead
                  </Button>
                </div>
              </div>
            )}

            {/* 7-Day Payment Cycle Info */}
            <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">7-Day Payment Cycle</p>
                <p className="text-xs text-blue-600">
                  Payments are released 7 days after delivery to handle returns. You receive 100% of your price.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Full Name *
                </label>
                <Input
                  data-testid="farmer-name-input"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* PIN Code with auto-lookup */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> PIN Code *
                </label>
                <div className="relative">
                  <Input
                    data-testid="farmer-pincode-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit PIN code"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  />
                  {pincodeLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {/* Location Display */}
                {(form.city || form.district || form.state) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-green-800">
                      {form.city && <span>{form.city}, </span>}
                      {form.district && <span>{form.district}, </span>}
                      {form.state}
                    </p>
                    <p className="text-green-600 text-xs mt-1">Location auto-detected from PIN code</p>
                  </div>
                )}
              </div>

              {/* Full Address - Appears after PIN code is entered */}
              {form.pincode.length === 6 && (form.city || form.state) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Full Address *
                  </label>
                  <textarea
                    data-testid="farmer-address-input"
                    placeholder="Enter your full address (House/Building, Street, Landmark)"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your address in {form.city || form.district}, {form.state} - {form.pincode}
                  </p>
                </div>
              )}

              {/* Aadhaar */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Aadhaar Number *
                </label>
                <Input
                  data-testid="farmer-aadhaar-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="12-digit Aadhaar number"
                  value={form.aadhaar}
                  onChange={(e) => setForm({ ...form, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                />
                <p className="text-xs text-muted-foreground">For identity verification. We only store last 4 digits.</p>
              </div>

              {/* Payment Preference */}
              <div className="space-y-3">
                <label className="text-sm font-medium">How would you like to receive payments? *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentPreference: 'upi' })}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                      form.paymentPreference === 'upi'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm font-medium">UPI</span>
                    <span className="text-xs text-muted-foreground">PhonePe, GPay, etc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentPreference: 'bank' })}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                      form.paymentPreference === 'bank'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Building className="w-5 h-5" />
                    <span className="text-sm font-medium">Bank Account</span>
                    <span className="text-xs text-muted-foreground">Direct transfer</span>
                  </button>
                </div>
              </div>

              {/* UPI ID */}
              {form.paymentPreference === 'upi' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">UPI ID *</label>
                  <Input
                    data-testid="farmer-upi-input"
                    placeholder="yourname@upi or phone@paytm"
                    value={form.upiId}
                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">You can find this in your PhonePe, Google Pay, or Paytm app</p>
                </div>
              )}

              {/* Bank Details */}
              {form.paymentPreference === 'bank' && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Holder Name</label>
                    <Input
                      placeholder="Name as per bank account"
                      value={form.accountHolder}
                      onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number *</label>
                    <Input
                      data-testid="farmer-account-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter account number"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">IFSC Code *</label>
                    <Input
                      data-testid="farmer-ifsc-input"
                      placeholder="e.g., SBIN0001234"
                      value={form.ifsc}
                      onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">We only store last 4 digits of account number for security.</p>
                </div>
              )}

              {/* Crop Types - Optional */}
              <div className="space-y-2">
                <label className="text-sm font-medium">What do you grow? (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {cropOptions.map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => toggleCrop(crop)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedCrops.includes(crop)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                      data-testid={`crop-${crop.toLowerCase()}`}
                    >
                      {selectedCrops.includes(crop) && <Check className="w-3 h-3 inline mr-1" />}
                      {crop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 btn-pill bg-primary text-primary-foreground"
                data-testid="complete-registration-btn"
              >
                {loading ? 'Setting up...' : 'Start Selling'}
              </Button>

              {/* Trust note */}
              <p className="text-xs text-center text-muted-foreground">
                You set your own prices. 0middle takes only ₹7 platform fee per order.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmerOnboarding;
