import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/App';
import { Sprout, ShoppingBag, ArrowRight } from 'lucide-react';

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const roles = [
    {
      id: 'farmer',
      title: "I'm a Farmer",
      description: "List your products, set your prices, and sell directly to consumers",
      icon: Sprout,
      color: 'primary',
      path: '/farmer',
      testId: 'select-farmer-role'
    },
    {
      id: 'consumer',
      title: "I'm a Consumer",
      description: "Browse fresh produce and buy directly from farmers near you",
      icon: ShoppingBag,
      color: 'secondary',
      path: '/browse',
      testId: 'select-consumer-role'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="heading-1 text-3xl md:text-4xl mb-3">How would you like to use 0middle?</h1>
          <p className="body-text">
            {user?.phone ? `Logged in as +91 ${user.phone}` : 'Select your role to continue'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card 
              key={role.id}
              data-testid={role.testId}
              onClick={() => navigate(role.path)}
              className={`cursor-pointer card-hover border-2 transition-all duration-300 hover:border-${role.color} hover:shadow-xl`}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className={`w-20 h-20 mx-auto rounded-full bg-${role.color}/10 flex items-center justify-center`}>
                  <role.icon className={`w-10 h-10 text-${role.color}`} style={{ color: role.color === 'primary' ? '#2F5233' : '#B5651D' }} />
                </div>
                
                <h2 className="heading-3 text-xl">{role.title}</h2>
                <p className="caption-text">{role.description}</p>
                
                <div className={`inline-flex items-center gap-2 text-sm font-medium`} style={{ color: role.color === 'primary' ? '#2F5233' : '#B5651D' }}>
                  Continue <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center caption-text mt-8">
          0middle is just the infrastructure — you own your products and set your prices.
        </p>
      </div>
    </div>
  );
};

export default RoleSelectPage;
