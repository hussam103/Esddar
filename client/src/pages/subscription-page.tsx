import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Building, Loader2, ArrowLeft } from "lucide-react";

// Form schema
const paymentFormSchema = z.object({
  cardName: z.string().min(2, "Cardholder name is required"),
  cardNumber: z.string().min(16, "Valid card number is required").max(19, "Card number is too long"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid expiry date (MM/YY)"),
  cvv: z.string().min(3, "CVV is required").max(4, "CVV should be 3-4 digits"),
  billingAddress: z.string().min(5, "Billing address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(4, "ZIP code is required")
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const plans = {
  basic: {
    name: "Basic",
    price: 29,
    features: [
      "Up to 20 tender recommendations/month",
      "Basic AI matching",
      "3 saved tenders",
      "Email notifications"
    ]
  },
  professional: {
    name: "Professional",
    price: 79,
    features: [
      "Unlimited tender recommendations",
      "Advanced AI matching",
      "20 saved tenders",
      "Proposal templates",
      "Basic analytics"
    ]
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    features: [
      "Everything in Professional plan",
      "Premium AI matching",
      "Unlimited saved tenders",
      "Advanced analytics and reporting",
      "API access",
      "Dedicated account manager"
    ]
  }
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ plan: string }>();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Make sure plan is valid
  const planKey = params.plan as keyof typeof plans; 
  const plan = plans[planKey] || plans.basic;

  // Form setup
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      billingAddress: "",
      city: "",
      state: "",
      zip: ""
    }
  });

  // If user is not logged in, redirect to auth page
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Handle form submission
  const onSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would be integrated with a payment provider
      // For now, we'll simulate a successful subscription
      
      // Add subscription to user
      await apiRequest("POST", "/api/subscribe", {
        plan: planKey,
        price: plan.price
      });

      // Update the user data in the queryClient
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Show success state
      setIsSuccess(true);
      
      toast({
        title: "Subscription successful!",
        description: `You've successfully subscribed to the ${plan.name} plan.`,
      });
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .match(/.{1,4}/g)
      ?.join(' ')
      .substr(0, 19) || '';
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .match(/^(\d{0,2})(\d{0,2})/)
      ?.slice(1)
      .filter(Boolean)
      .join('/') || '';
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <Card className="border-2 border-primary">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle>Subscription Confirmed!</CardTitle>
              <CardDescription>
                You've successfully subscribed to the {plan.name} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-6">
                  Thank you for subscribing! Your account has been upgraded and you now have access to all {plan.name} plan features.
                </p>
                <div className="font-medium mb-2">Subscription Details:</div>
                <div className="text-sm text-gray-600">
                  <div>Plan: {plan.name}</div>
                  <div>Amount: ${plan.price}/month</div>
                  <div>Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => setLocation("/")}
              >
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Subscribe to {plan.name} Plan</h1>
            <p className="text-gray-600">Complete your subscription to access premium features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Enter your payment details securely</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <div className="px-3 text-sm text-gray-500 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Card Details
                          </div>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        <FormField
                          control={form.control}
                          name="cardName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cardholder Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                              <FormItem className="col-span-2 md:col-span-1">
                                <FormLabel>Card Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="4242 4242 4242 4242" 
                                    value={field.value}
                                    onChange={e => {
                                      field.onChange(formatCardNumber(e.target.value));
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4 col-span-2 md:col-span-1">
                            <FormField
                              control={form.control}
                              name="expiryDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expiry Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="MM/YY" 
                                      value={field.value}
                                      onChange={e => {
                                        field.onChange(formatExpiryDate(e.target.value));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="cvv"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CVV</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="123" 
                                      maxLength={4}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex items-center">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <div className="px-3 text-sm text-gray-500 flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Billing Address
                          </div>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        <FormField
                          control={form.control}
                          name="billingAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="San Francisco" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input placeholder="California" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="94103" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>Subscribe - ${plan.price}/month</>
                          )}
                        </Button>
                        <p className="text-xs text-center text-gray-500 mt-2">
                          Your payment information is securely processed
                        </p>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review your subscription details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">{plan.name} Plan</h3>
                      <p className="text-sm text-gray-600">Monthly subscription</p>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Separator />

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">${plan.price}/month</span>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                      By subscribing, you agree to our Terms of Service and Privacy Policy. 
                      You can cancel your subscription at any time from your account settings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}