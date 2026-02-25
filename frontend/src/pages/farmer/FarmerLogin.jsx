import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/App';
import { sendOTP, verifyOTP } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Sprout, UserPlus, User } from 'lucide-react';

const FarmerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('select'); // 'select' | 'phone' | 'otp'
  const [isNewFarmer, setIsNewFarmer] = useState(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  const handleFarmerTypeSelect = (isNew) => {
    setIsNewFarmer(isNew);
    setStep('phone');
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOTP(phone);
      setDemoOtp(res.data.demo_otp);
      toast.success(`OTP sent! (Demo: ${res.data.demo_otp})`);
      setStep('otp');
    } catch (err) {
      toast.error('Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(phone, otp);
      if (res.data.verified) {
        login({
          phone: res.data.phone,
          isRegisteredFarmer: res.data.is_registered_farmer,
          farmer: res.data.farmer,
          role: 'farmer'
        });
        
        if (isNewFarmer) {
          // New farmer - go to onboarding
          navigate('/farmer/onboarding');
        } else {
          // Existing farmer - always go to products page
          if (res.data.is_registered_farmer) {
            toast.success(`Welcome back, ${res.data.farmer.name}!`);
          } else {
            toast.success('Welcome! You can now browse and manage products.');
          }
          navigate('/farmer/products');
        }
      } else {
        toast.error('Invalid OTP');
      }
    } catch (err) {
      toast.error('Verification failed');
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else if (step === 'phone') {
      setStep('select');
      setIsNewFarmer(null);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sprout className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="heading-2 text-2xl">Farmer's Corner</CardTitle>
            <CardDescription className="body-text">
              {step === 'select' && 'Are you new to 0middle?'}
              {step === 'phone' && (isNewFarmer ? 'Enter your mobile number to get started' : 'Enter your registered mobile number')}
              {step === 'otp' && 'Enter the OTP sent to your phone'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Step 1: Select New or Existing */}
            {step === 'select' && (
              <>
                <div className="space-y-3">
                  <button
                    onClick={() => handleFarmerTypeSelect(true)}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 text-left"
                    data-testid="new-farmer-btn"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <UserPlus className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">I'm a New Farmer</p>
                      <p className="text-sm text-muted-foreground">Join the empowered farmers community</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleFarmerTypeSelect(false)}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 text-left"
                    data-testid="existing-farmer-btn"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">I'm an Existing Farmer</p>
                      <p className="text-sm text-muted-foreground">Login to manage my products</p>
                    </div>
                  </button>
                </div>

                <p className="text-center caption-text">
                  List products, set prices, and sell directly to consumers
                </p>
              </>
            )}

            {/* Step 2: Phone Input */}
            {step === 'phone' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
                    <Input
                      data-testid="phone-input"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="pl-12 h-12 text-lg"
                    />
                  </div>
                </div>

                <Button
                  data-testid="send-otp-btn"
                  onClick={handleSendOTP}
                  disabled={loading || phone.length !== 10}
                  className="w-full h-12 btn-pill bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>

                <p className="text-center caption-text">
                  {isNewFarmer 
                    ? 'We\'ll send an OTP to verify your number'
                    : 'We\'ll send an OTP to your registered number'}
                </p>
              </>
            )}

            {/* Step 3: OTP Verification */}
            {step === 'otp' && (
              <>
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    OTP sent to <span className="font-medium text-foreground">+91 {phone}</span>
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter 6-digit OTP</label>
                    <Input
                      data-testid="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-14 text-2xl text-center tracking-[0.5em] font-mono"
                    />
                  </div>

                  {demoOtp && (
                    <p className="text-center text-sm bg-secondary/10 text-secondary p-2 rounded-lg">
                      Demo OTP: <span className="font-mono font-bold">{demoOtp}</span>
                    </p>
                  )}
                </div>

                <Button
                  data-testid="verify-otp-btn"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 btn-pill bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full text-muted-foreground"
                  data-testid="resend-otp-btn"
                >
                  Resend OTP
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmerLogin;
