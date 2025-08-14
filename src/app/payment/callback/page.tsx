"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const handlePaymentCallback = useMutation(api.financial.handlePaymentCallback);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get payment details from URL parameters
        const gateway = searchParams.get('gateway') as 'paystack' | 'flutterwave';
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        const status = searchParams.get('status');
        const transactionId = searchParams.get('transaction_id') || searchParams.get('tx_ref');
        const amount = parseFloat(searchParams.get('amount') || '0');
        const currency = searchParams.get('currency') as 'NGN' | 'USD' || 'NGN';

        if (!gateway || !reference || !status) {
          throw new Error('Invalid payment callback parameters');
        }

        // Process the callback
        const result = await handlePaymentCallback({
          gateway,
          reference,
          status,
          transactionId: transactionId || reference,
          amount,
          currency,
        });

        setPaymentDetails({
          gateway,
          reference,
          status,
          transactionId,
          amount,
          currency,
        });

        if (result.status === 'successful' || result.status === 'success') {
          setStatus('success');
          toast.success('Payment processed successfully!');
        } else {
          setStatus('failed');
          toast.error('Payment failed or was cancelled');
        }
      } catch (error: any) {
        console.error('Payment callback error:', error);
        setStatus('failed');
        toast.error(error.message || 'Payment processing failed');
      }
    };

    processCallback();
  }, [searchParams, handlePaymentCallback]);

  const handleReturnToDashboard = () => {
    router.push('/financial');
  };

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === 'processing' && (
              <Clock className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-600" />
            )}
            {status === 'failed' && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {status === 'processing' && 'Processing Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
          
          <CardDescription>
            {status === 'processing' && 'Please wait while we process your payment'}
            {status === 'success' && 'Your payment has been processed successfully'}
            {status === 'failed' && 'There was an issue processing your payment'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-gray-900">Payment Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Gateway:</span>
                  <span className="ml-2 capitalize">{paymentDetails.gateway}</span>
                </div>
                <div>
                  <span className="text-gray-600">Reference:</span>
                  <span className="ml-2 font-mono text-xs">{paymentDetails.reference}</span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2">
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: paymentDetails.currency,
                    }).format(paymentDetails.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 capitalize ${
                    status === 'success' ? 'text-green-600' : 
                    status === 'failed' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {paymentDetails.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Your payment has been recorded in our system</li>
                <li>• A receipt has been generated for your records</li>
                <li>• You will receive a confirmation notification</li>
                <li>• The financial record status has been updated</li>
              </ul>
            </div>
          )}

          {status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">What you can do:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Check your payment method and try again</li>
                <li>• Ensure you have sufficient funds</li>
                <li>• Contact support if the issue persists</li>
                <li>• You can also make a manual payment</li>
              </ul>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handleReturnToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Financial Dashboard
            </Button>
            
            {status === 'failed' && (
              <Button
                onClick={() => router.push('/financial')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentCallbackLoading() {
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Clock className="w-16 h-16 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Loading Payment Details...</CardTitle>
          <CardDescription>Please wait while we load your payment information</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackLoading />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}