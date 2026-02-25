import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/App';
import { sendOTP, verifyOTP } from '@/lib/api';
import { toast } from 'sonner';
import { Phone, ArrowLeft, Leaf } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

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
          farmer: res.data.farmer
        });
        toast.success('Login successful!');
        navigate('/select-role');
      } else {
        toast.error('Invalid OTP');
      }
    } catch (err) {
      toast.error('Verification failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => step === 'otp' ? setStep('phone') : navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="heading-2 text-2xl">Welcome to 0middle</CardTitle>
            <CardDescription className="body-text">
              {step === 'phone' 
                ? 'Enter your mobile number to continue' 
                : 'Enter the OTP sent to your phone'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {step === 'phone' ? (
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
                  By continuing, you agree to our Terms of Service
                </p>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    OTP sent to <span className="font-medium text-foreground">+91 {phone}</span>
                  </p>
                  
                  <div className="flex justify-center">
                    <InputOTP
                      data-testid="otp-input"
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                        <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                        <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                        <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                        <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                        <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
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

export default LoginPage;
