"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CreditCard, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { paymentService } from "@/lib/payment-service"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"

interface PaystackPaymentButtonProps {
  subscriptionId: string
  subscriptionName: string
  amount: number
  onPaymentSuccess?: () => void
}

export function PaystackPaymentButton({ 
  subscriptionId, 
  subscriptionName, 
  amount, 
  onPaymentSuccess 
}: PaystackPaymentButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const handlePayment = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')

    try {
      // Initialize Paystack payment
      const result = await paymentService.initializePaystackPayment(
        user.email,
        amount,
        subscriptionName
      )

      if (!result.success || !result.authorization_url) {
        throw new Error(result.error || 'Failed to initialize payment')
      }

      // Open Paystack payment page in a popup
      const paystackWindow = window.open(
        result.authorization_url,
        'paystackPayment',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      if (!paystackWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }

      // Listen for payment completion
      const checkPaymentStatus = setInterval(async () => {
        if (paystackWindow.closed) {
          clearInterval(checkPaymentStatus)
          
          // Verify payment
          if (result.reference) {
            const verification = await paymentService.verifyPaystackPayment(result.reference)
            
            if (verification.success && verification.status === 'success') {
              setPaymentStatus('success')
              toast({
                title: "Payment Successful",
                description: `Payment of ${verification.currency} ${verification.amount} for ${subscriptionName} was successful!`,
              })
              
              if (onPaymentSuccess) {
                onPaymentSuccess()
              }
              
              setTimeout(() => {
                setShowDialog(false)
                setPaymentStatus('idle')
              }, 2000)
            } else {
              setPaymentStatus('error')
              toast({
                title: "Payment Failed",
                description: verification.error || "Payment was not completed",
                variant: "destructive",
              })
            }
          }
          
          setIsProcessing(false)
        }
      }, 1000)

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(checkPaymentStatus)
        if (!paystackWindow.closed) {
          paystackWindow.close()
        }
        setIsProcessing(false)
      }, 300000)

    } catch (error) {
      console.error('Payment initialization failed:', error)
      setPaymentStatus('error')
      setIsProcessing(false)
      
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <CreditCard className="h-4 w-4" />
        Pay with Card
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay for {subscriptionName}</DialogTitle>
            <DialogDescription>
              Complete payment for your subscription using your debit/credit card via Paystack
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subscription</Label>
              <Input value={subscriptionName} disabled />
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input value={`KSh ${amount.toFixed(2)}`} disabled />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>

            {paymentStatus === 'processing' && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing payment... Complete payment in popup window</span>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Payment successful!</span>
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Payment failed. Please try again.</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || paymentStatus === 'success'}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
