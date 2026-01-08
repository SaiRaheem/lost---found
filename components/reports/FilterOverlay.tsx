'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ITEM_CATEGORIES, ITEM_STATUS } from '@/utils/constants';

interface FilterOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
}

export interface FilterState {
    category: string;
    status: string;
    role: string;
}

const FilterOverlay: React.FC<FilterOverlayProps> = ({ isOpen, onClose, onApply }) => {
    const [filters, setFilters] = useState<FilterState>({
        category: '',
        status: '',
        role: '',
    });

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = { category: '', status: '', role: '' };
        setFilters(resetFilters);
        onApply(resetFilters);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Filter Reports" size="sm">
            <div className="space-y-6">
                <Select
                    label="Category"
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    options={[
                        { value: '', label: 'All Categories' },
                        ...ITEM_CATEGORIES.map(cat => ({ value: cat, label: cat }))
                    ]}
                />

                <Select
                    label="Status"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    options={[
                        { value: '', label: 'All Statuses' },
                        { value: ITEM_STATUS.PENDING, label: 'Pending' },
                        { value: ITEM_STATUS.ACTIVE, label: 'Active' },
                        { value: ITEM_STATUS.MATCHED, label: 'Matched' },
                        { value: ITEM_STATUS.RETURNED, label: 'Returned' },
                    ]}
                />

                <Select
                    label="Role"
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    options={[
                        { value: '', label: 'All Roles' },
                        { value: 'finder', label: 'Finder' },
                        { value: 'owner', label: 'Owner' },
                    ]}
                />

                <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={handleReset} className="flex-1">
                        Reset
                    </Button>
                    <Button variant="primary" onClick={handleApply} className="flex-1">
                        Apply Filters
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default FilterOverlay;
