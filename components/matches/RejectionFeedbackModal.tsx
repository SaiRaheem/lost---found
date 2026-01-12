'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, MapPin, Package, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface RejectionFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, details?: string) => void;
    isLoading?: boolean;
}

const rejectionReasons = [
    { value: 'wrong_item', label: 'Wrong Item', icon: Package, description: 'This is not my item' },
    { value: 'wrong_brand', label: 'Wrong Brand/Model', icon: AlertCircle, description: 'Different brand or model' },
    { value: 'wrong_location', label: 'Wrong Location', icon: MapPin, description: 'Found in different location' },
    { value: 'already_returned', label: 'Already Returned', icon: CheckCircle, description: 'I already got my item back' },
    { value: 'other', label: 'Other Reason', icon: AlertCircle, description: 'Something else' },
];

export default function RejectionFeedbackModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false
}: RejectionFeedbackModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [details, setDetails] = useState('');

    const handleSubmit = () => {
        if (!selectedReason) return;
        onSubmit(selectedReason, details || undefined);
    };

    const handleClose = () => {
        setSelectedReason('');
        setDetails('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="w-full max-w-lg"
                        >
                            <Card variant="glass">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-amber-500" />
                                            Why reject this match?
                                        </CardTitle>
                                        <button
                                            onClick={handleClose}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Your feedback helps improve our matching algorithm
                                    </p>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Reason Options */}
                                    <div className="space-y-2">
                                        {rejectionReasons.map((reason) => {
                                            const Icon = reason.icon;
                                            return (
                                                <motion.button
                                                    key={reason.value}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedReason(reason.value)}
                                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedReason === reason.value
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Icon className={`h-5 w-5 mt-0.5 ${selectedReason === reason.value
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <p className="font-medium">{reason.label}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {reason.description}
                                                            </p>
                                                        </div>
                                                        {selectedReason === reason.value && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                                                            >
                                                                <CheckCircle className="h-3 w-3 text-white" />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Optional Details */}
                                    {selectedReason === 'other' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <textarea
                                                value={details}
                                                onChange={(e) => setDetails(e.target.value)}
                                                placeholder="Please provide more details..."
                                                className="w-full input min-h-[100px] resize-none"
                                                maxLength={500}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {details.length}/500 characters
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={handleClose}
                                            disabled={isLoading}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={handleSubmit}
                                            disabled={!selectedReason || isLoading}
                                            isLoading={isLoading}
                                            className="flex-1"
                                        >
                                            Reject Match
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
