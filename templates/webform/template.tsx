import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DynamicFormCrudService } from '../../../core/services/dynamic-form-crud.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface ComplianceCertification {
    id: string;
    name: string;
    fileName?: string;
    fileData?: string;
    uploadDate?: string;
}

interface BusinessUnit {
    bus_unit_id?: string;
    tenant_id?: string;
    org_id: string;
    parent_bus_unit_id?: string | null;
    bus_unit_code: string;
    bus_unit_name: string;
    bus_unit_type_name?: string;
    func_area?: string;
    cost_ctr_cd?: string;
    profit_ctr_cd?: string;
    bud_cd?: string;
    bus_unit_head_name?: string;
    bus_unit_head_email?: string;
    bus_unit_head_phone_num?: string;
    rpt_mgr_id?: string;
    est_dt?: string;
    bus_unit_desc?: string;
    core_funcs?: string;
    key_resp?: string;
    prim_loc_country?: string;
    prim_loc_city?: string;
    contact_email_id?: string;
    contact_phone_num?: string;
    compl_cert?: ComplianceCertification[];
    risk_assess_lvl?: string;
    audit_freq?: string;
    last_audit_dt?: string;
    next_audit_dt?: string;
    strat_obj?: string;
    key_init?: string;
    eff_start_dt?: string;
    curr_rec_ind?: string;
    act_status: string;

    // Enhanced fields from Organizations
    website_url?: string;
    social_med_links?: string;
    mission_stmt?: string;
    vision_stmt?: string;
    business_obj?: string;
    business_goals?: string;
    total_emp_num?: number;
    annual_rev_num?: number;
    geo_footprint?: string;
    regulatory_body_name?: string;
    audit_firm?: string;

    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    access_group_id?: string;
}

interface ColumnConfig {
    seqNo: number;
    uiElementId: string;
    uiElementLabel: string;
    position: string;
}

@Component({
    selector: 'app-business-units',
    templateUrl: './business-units.component.html',
    styleUrls: ['./business-units.component.scss']
})
export class BusinessUnitsComponent implements OnInit, OnDestroy {
    // Data properties
    businessUnits: BusinessUnit[] = [];
    filteredBusinessUnits: BusinessUnit[] = [];
    currentBusinessUnit: BusinessUnit = this.getEmptyBusinessUnit();
    selectedBusinessUnit: BusinessUnit = this.getEmptyBusinessUnit();

    // Configuration properties (from config.json)
    formConfig: any = {};
    columnConfig: ColumnConfig[] = [];
    defaultColumns: ColumnConfig[] = [];
    selectableColumns: ColumnConfig[] = [];
    allColumns: ColumnConfig[] = [];

    // UI state properties
    isLoading = false;
    isAddEditModalOpen = false;
    isViewMode = false;
    isEditMode = false;
    isColumnModalOpen = false;
    showColumnModal = false;
    showDeleteModal = false;

    // Filter properties
    searchTerm = '';
    statusFilter = '';
    typeFilter = '';
    organizationFilter = '';

    // Pagination properties
    currentPage = 1;
    pageSize = 25;
    totalItems = 0;

    // Summary data
    summaryData = {
        total: 0,
        active: 0,
        inactive: 0,
        recentlyAdded: 0
    };

    // Column visibility
    visibleColumns: { [key: string]: boolean } = {};
    tempVisibleColumns: any = {};

    // Selection management
    selectedBusinessUnits: string[] = [];

    // Dropdown options
    statusOptions = [
        { content: 'All Status', value: '' },
        { content: 'Active', value: 'Active' },
        { content: 'Inactive', value: 'Inactive' }
    ];

    typeOptions = [
        { content: 'All Types', value: '' }
    ];

    organizationOptions = [
        { content: 'All Organizations', value: '' }
    ];

    parentBusinessUnitOptions: any[] = [
        { content: 'None', value: null }
    ];

    businessUnitTypeOptions = [
        { content: 'Operations', value: 'Operations' },
        { content: 'Finance', value: 'Finance' },
        { content: 'Technology', value: 'Technology' },
        { content: 'Human Resources', value: 'Human Resources' },
        { content: 'Marketing', value: 'Marketing' },
        { content: 'Sales', value: 'Sales' }
    ];

    functionalAreaOptions = [
        { content: 'Core Business', value: 'Core Business' },
        { content: 'Support', value: 'Support' },
        { content: 'Strategic', value: 'Strategic' },
        { content: 'Administrative', value: 'Administrative' }
    ];

    riskAssessmentOptions = [
        { content: 'Low', value: 'Low' },
        { content: 'Medium', value: 'Medium' },
        { content: 'High', value: 'High' },
        { content: 'Critical', value: 'Critical' }
    ];

    auditFrequencyOptions = [
        { content: 'Quarterly', value: 'Quarterly' },
        { content: 'Semi-Annual', value: 'Semi-Annual' },
        { content: 'Annual', value: 'Annual' },
        { content: 'Bi-Annual', value: 'Bi-Annual' }
    ];

    activityStatusOptions = [
        { content: 'Active', value: 'Active' },
        { content: 'Inactive', value: 'Inactive' },
        { content: 'Pending', value: 'Pending' },
        { content: 'Suspended', value: 'Suspended' }
    ];

    geographicFootprintOptions = [
        { content: 'Local', value: 'Local' },
        { content: 'Regional', value: 'Regional' },
        { content: 'National', value: 'National' },
        { content: 'International', value: 'International' },
        { content: 'Global', value: 'Global' }
    ];

    // Subscriptions management
    private subscriptions = new Subscription();

    constructor(
        private http: HttpClient,
        private dynamicFormCrudService: DynamicFormCrudService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        console.log('BusinessUnitsComponent ngOnInit called');
        console.log('BUSINESS_UNITS_INIT: Current timestamp:', new Date().toISOString());

        // Enhanced debugging for token status at component initialization
        const accessToken = this.authService.getAccessToken();
        const currentUser = this.authService.getCurrentUser();
        const tokenStatus = this.authService.getTokenStatus();

        console.log('BUSINESS_UNITS_INIT: Initial state check:', {
            hasAccessToken: !!accessToken,
            tokenLength: accessToken?.length || 0,
            hasCurrentUser: !!currentUser,
            tokenStatus: tokenStatus
        });

        // Initialize column configuration
        this.initializeColumnConfiguration();

        // Add delay to allow token to settle after OTP validation
        setTimeout(() => {
            console.log('BUSINESS_UNITS_INIT: Delayed authentication check after 100ms');

            // Check if user is authenticated before making API calls
            if (this.authService.isAuthenticated()) {
                console.log('BUSINESS_UNITS_INIT: User is authenticated, loading business units');
                this.loadBusinessUnits();
            } else {
                console.log('BUSINESS_UNITS_INIT: User is not authenticated, skipping API call');
                // Initialize empty state and stop loading
                this.businessUnits = [];
                this.applyFilters();
                this.updateSummary();
                this.isLoading = false;
            }
        }, 100);
    }

    private initializeColumnConfiguration(): void {
        // Column configuration based on config.json businessunitForm.columnHeaders
        // Default columns (position: "default" in config.json)
        this.defaultColumns = [
            { seqNo: 1, uiElementId: 'org_id', uiElementLabel: 'Organization Identifier', position: 'default' },
            { seqNo: 3, uiElementId: 'bus_unit_code', uiElementLabel: 'Business Unit Code', position: 'default' },
            { seqNo: 4, uiElementId: 'bus_unit_name', uiElementLabel: 'Business Unit Name', position: 'default' },
            { seqNo: 15, uiElementId: 'bus_unit_desc', uiElementLabel: 'Business Unit Description', position: 'default' },
            { seqNo: 29, uiElementId: 'act_status', uiElementLabel: 'Status', position: 'default' }
        ];

        // Selectable columns (position: "dynamic" in config.json)
        this.selectableColumns = [
            { seqNo: 2, uiElementId: 'parent_bus_unit_id', uiElementLabel: 'Parent Business Unit Identifier', position: 'dynamic' },
            { seqNo: 5, uiElementId: 'bus_unit_type_name', uiElementLabel: 'Business Unit Type', position: 'dynamic' },
            { seqNo: 6, uiElementId: 'func_area', uiElementLabel: 'Functional Area', position: 'dynamic' },
            { seqNo: 7, uiElementId: 'cost_ctr_cd', uiElementLabel: 'Cost Center Code', position: 'dynamic' },
            { seqNo: 8, uiElementId: 'profit_ctr_cd', uiElementLabel: 'Profit Center Code', position: 'dynamic' },
            { seqNo: 9, uiElementId: 'bud_cd', uiElementLabel: 'Budget Code', position: 'dynamic' },
            { seqNo: 10, uiElementId: 'bus_unit_head_name', uiElementLabel: 'Business Unit Head Name', position: 'dynamic' },
            { seqNo: 11, uiElementId: 'bus_unit_head_email', uiElementLabel: 'Business Unit Head Email', position: 'dynamic' },
            { seqNo: 12, uiElementId: 'bus_unit_head_phone_num', uiElementLabel: 'Business Unit Head Phone', position: 'dynamic' },
            { seqNo: 13, uiElementId: 'rpt_mgr_id', uiElementLabel: 'Reporting Manager Identifier', position: 'dynamic' },
            { seqNo: 14, uiElementId: 'est_dt', uiElementLabel: 'Establishment Date', position: 'dynamic' },
            { seqNo: 16, uiElementId: 'core_funcs', uiElementLabel: 'Core Functions', position: 'dynamic' },
            { seqNo: 17, uiElementId: 'key_resp', uiElementLabel: 'Key Responsibilities', position: 'dynamic' },
            { seqNo: 18, uiElementId: 'prim_loc_country', uiElementLabel: 'Primary Location Country', position: 'dynamic' },
            { seqNo: 19, uiElementId: 'prim_loc_city', uiElementLabel: 'Primary Location City', position: 'dynamic' },
            { seqNo: 20, uiElementId: 'contact_email_id', uiElementLabel: 'Contact Email', position: 'dynamic' },
            { seqNo: 21, uiElementId: 'contact_phone_num', uiElementLabel: 'Contact Number', position: 'dynamic' },
            { seqNo: 22, uiElementId: 'compl_cert', uiElementLabel: 'Compliance Certifications', position: 'dynamic' },
            { seqNo: 23, uiElementId: 'risk_assess_lvl', uiElementLabel: 'Risk Assessment Level', position: 'dynamic' },
            { seqNo: 24, uiElementId: 'audit_freq', uiElementLabel: 'Audit Frequency', position: 'dynamic' },
            { seqNo: 25, uiElementId: 'last_audit_dt', uiElementLabel: 'Last Audit Date', position: 'dynamic' },
            { seqNo: 26, uiElementId: 'next_audit_dt', uiElementLabel: 'Next Audit Date', position: 'dynamic' },
            { seqNo: 27, uiElementId: 'strat_obj', uiElementLabel: 'Strategic Objectives', position: 'dynamic' },
            { seqNo: 28, uiElementId: 'key_init', uiElementLabel: 'Key Initiatives', position: 'dynamic' }
        ];

        // Combine all columns
        this.allColumns = [...this.defaultColumns, ...this.selectableColumns];

        // Initialize column visibility - default columns are always visible
        this.defaultColumns.forEach(col => {
            this.visibleColumns[col.uiElementId] = true;
        });

        // Load saved preferences for selectable columns or set defaults
        const savedPreferences = localStorage.getItem('businessUnitsColumnPreferences');
        if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            this.selectableColumns.forEach(col => {
                this.visibleColumns[col.uiElementId] = preferences[col.uiElementId] || false;
            });
        } else {
            // Default: show first 2 selectable columns
            const implementedSelectableColumns = this.selectableColumns.slice(0, 2);
            implementedSelectableColumns.forEach(col => {
                this.visibleColumns[col.uiElementId] = true;
            });

            // Hide remaining selectable columns
            this.selectableColumns.slice(2).forEach(col => {
                this.visibleColumns[col.uiElementId] = false;
            });
        }
    }

    private loadBusinessUnits(): void {
        console.log('LOAD_BUSINESS_UNITS: Called - making API call to businessunitForm');
        console.log('LOAD_BUSINESS_UNITS: Timestamp:', new Date().toISOString());

        // Enhanced authentication debugging
        const accessToken = this.authService.getAccessToken();
        const tokenStatus = this.authService.getTokenStatus();

        console.log('LOAD_BUSINESS_UNITS: Pre-API authentication check:', {
            isAuthenticated: this.authService.isAuthenticated(),
            currentUser: !!this.authService.getCurrentUser(),
            accessToken: !!accessToken,
            tokenLength: accessToken?.length || 0,
            tokenStatus: tokenStatus
        });

        // Double-check authentication before making API call
        if (!this.authService.isAuthenticated()) {
            console.log('LOAD_BUSINESS_UNITS: User not authenticated, cannot load business units');
            this.businessUnits = [];
            this.applyFilters();
            this.updateSummary();
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        console.log('LOAD_BUSINESS_UNITS: Setting isLoading to true, making API call...');

        const subscription = this.dynamicFormCrudService.getAll('businessunitForm').subscribe({
            next: (data) => {
                console.log('LOAD_BUSINESS_UNITS: API response received successfully:', data);

                // Extract columnHeaders and records from API response
                if (data && data.columnHeaders) {
                    this.updateColumnConfiguration(data.columnHeaders);
                }

                // Extract business units data - could be in data.records or data.data or directly data
                this.businessUnits = data.records || data.data || data || [];
                console.log('LOAD_BUSINESS_UNITS: Business units loaded:', this.businessUnits.length, 'items');

                // Populate dynamic filter options from API data
                this.populateTypeOptions();
                this.populateFormDropdownOptions();

                this.applyFilters();
                this.updateSummary();
                this.isLoading = false;
                console.log('LOAD_BUSINESS_UNITS: Loading completed successfully');
            },
            error: (error) => {
                console.error('LOAD_BUSINESS_UNITS: Error loading business units:', error);
                console.log('LOAD_BUSINESS_UNITS: Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    error: error.error
                });

                this.isLoading = false;

                // Handle authentication errors specifically
                if (error.status === 401) {
                    console.log('LOAD_BUSINESS_UNITS: 401 Unauthorized error - redirecting to login');
                    console.log('LOAD_BUSINESS_UNITS: Token state at error:', {
                        accessToken: !!this.authService.getAccessToken(),
                        currentUser: !!this.authService.getCurrentUser()
                    });
                    this.authService.logoutAndRedirect();
                    return;
                }

                // Initialize sample data if API fails for other reasons
                console.log('LOAD_BUSINESS_UNITS: API failed, loading sample data for testing');
                this.loadSampleData();
                this.applyFilters();
                this.updateSummary();
            }
        });
        this.subscriptions.add(subscription);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    // Load sample data for testing when API is not available
    private loadSampleData(): void {
        console.log('Loading sample business units data for testing');

        this.businessUnits = [
            {
                bus_unit_id: 'BU001',
                org_id: 'ORG001',
                bus_unit_code: 'FIN-001',
                bus_unit_name: 'Finance Operations',
                bus_unit_desc: 'Handles all financial operations and accounting',
                bus_unit_type_name: 'Finance',
                func_area: 'Core Business',
                cost_ctr_cd: 'CC001',
                profit_ctr_cd: 'PC001',
                bud_cd: 'BUD001',
                bus_unit_head_name: 'John Smith',
                bus_unit_head_email: 'john.smith@company.com',
                bus_unit_head_phone_num: '+1-555-0101',
                rpt_mgr_id: 'MGR001',
                est_dt: '2020-01-15',
                core_funcs: 'Financial planning, budgeting, accounting, auditing',
                key_resp: 'Manage company finances, ensure compliance with financial regulations',
                prim_loc_country: 'United States',
                prim_loc_city: 'New York',
                contact_email_id: 'finance@company.com',
                contact_phone_num: '+1-555-0100',
                risk_assess_lvl: 'Medium',
                audit_freq: 'Quarterly',
                last_audit_dt: '2024-06-15',
                next_audit_dt: '2024-09-15',
                strat_obj: 'Optimize financial processes and reduce costs by 10%',
                key_init: 'Digital transformation of financial workflows',
                act_status: 'Active',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-08-15T10:30:00Z'
            },
            {
                bus_unit_id: 'BU002',
                org_id: 'ORG001',
                bus_unit_code: 'HR-001',
                bus_unit_name: 'Human Resources',
                bus_unit_desc: 'Manages employee relations and recruitment',
                bus_unit_type_name: 'Human Resources',
                func_area: 'Support',
                cost_ctr_cd: 'CC002',
                profit_ctr_cd: 'PC002',
                bud_cd: 'BUD002',
                bus_unit_head_name: 'Sarah Johnson',
                bus_unit_head_email: 'sarah.johnson@company.com',
                bus_unit_head_phone_num: '+1-555-0102',
                rpt_mgr_id: 'MGR002',
                est_dt: '2020-02-01',
                core_funcs: 'Recruitment, employee development, performance management',
                key_resp: 'Attract and retain top talent, ensure employee satisfaction',
                prim_loc_country: 'United States',
                prim_loc_city: 'San Francisco',
                contact_email_id: 'hr@company.com',
                contact_phone_num: '+1-555-0200',
                risk_assess_lvl: 'Low',
                audit_freq: 'Annual',
                last_audit_dt: '2024-03-01',
                next_audit_dt: '2025-03-01',
                strat_obj: 'Improve employee retention rate to 95%',
                key_init: 'Implementation of new performance management system',
                act_status: 'Active',
                created_at: '2024-01-15T00:00:00Z',
                updated_at: '2024-08-20T14:15:00Z'
            },
            {
                bus_unit_id: 'BU003',
                org_id: 'ORG001',
                bus_unit_code: 'IT-001',
                bus_unit_name: 'Information Technology',
                bus_unit_desc: 'Technology infrastructure and software development',
                bus_unit_type_name: 'Technology',
                func_area: 'Strategic',
                cost_ctr_cd: 'CC003',
                profit_ctr_cd: 'PC003',
                bud_cd: 'BUD003',
                bus_unit_head_name: 'Michael Chen',
                bus_unit_head_email: 'michael.chen@company.com',
                bus_unit_head_phone_num: '+1-555-0103',
                rpt_mgr_id: 'MGR003',
                est_dt: '2019-11-15',
                core_funcs: 'Software development, infrastructure management, cybersecurity',
                key_resp: 'Ensure system reliability, develop new technologies, maintain security',
                prim_loc_country: 'United States',
                prim_loc_city: 'Austin',
                contact_email_id: 'it@company.com',
                contact_phone_num: '+1-555-0300',
                risk_assess_lvl: 'High',
                audit_freq: 'Quarterly',
                last_audit_dt: '2024-07-01',
                next_audit_dt: '2024-10-01',
                strat_obj: 'Modernize technology stack and improve system performance',
                key_init: 'Migration to cloud infrastructure and AI integration',
                act_status: 'Active',
                created_at: '2024-02-01T00:00:00Z',
                updated_at: '2024-09-01T16:45:00Z'
            },
            {
                bus_unit_id: 'BU004',
                org_id: 'ORG001',
                bus_unit_code: 'MKT-001',
                bus_unit_name: 'Marketing & Sales',
                bus_unit_desc: 'Marketing campaigns and sales operations',
                bus_unit_type_name: 'Marketing',
                func_area: 'Core Business',
                cost_ctr_cd: 'CC004',
                profit_ctr_cd: 'PC004',
                bud_cd: 'BUD004',
                bus_unit_head_name: 'Emily Rodriguez',
                bus_unit_head_email: 'emily.rodriguez@company.com',
                bus_unit_head_phone_num: '+1-555-0104',
                rpt_mgr_id: 'MGR004',
                est_dt: '2020-03-10',
                core_funcs: 'Brand management, digital marketing, sales enablement',
                key_resp: 'Drive revenue growth, build brand awareness, support sales team',
                prim_loc_country: 'United States',
                prim_loc_city: 'Chicago',
                contact_email_id: 'marketing@company.com',
                contact_phone_num: '+1-555-0400',
                risk_assess_lvl: 'Medium',
                audit_freq: 'Semi-Annual',
                last_audit_dt: '2024-04-15',
                next_audit_dt: '2024-10-15',
                strat_obj: 'Increase market share by 15% and improve lead quality',
                key_init: 'Launch of new digital marketing platform and CRM integration',
                act_status: 'Active',
                created_at: '2024-01-20T00:00:00Z',
                updated_at: '2024-08-25T11:20:00Z'
            },
            {
                bus_unit_id: 'BU005',
                org_id: 'ORG001',
                bus_unit_code: 'OPS-001',
                bus_unit_name: 'Operations',
                bus_unit_desc: 'Day-to-day operational activities and logistics',
                bus_unit_type_name: 'Operations',
                func_area: 'Core Business',
                cost_ctr_cd: 'CC005',
                profit_ctr_cd: 'PC005',
                bud_cd: 'BUD005',
                bus_unit_head_name: 'David Wilson',
                bus_unit_head_email: 'david.wilson@company.com',
                bus_unit_head_phone_num: '+1-555-0105',
                rpt_mgr_id: 'MGR005',
                est_dt: '2020-01-01',
                core_funcs: 'Supply chain management, quality control, process optimization',
                key_resp: 'Ensure operational efficiency, maintain quality standards',
                prim_loc_country: 'United States',
                prim_loc_city: 'Detroit',
                contact_email_id: 'operations@company.com',
                contact_phone_num: '+1-555-0500',
                risk_assess_lvl: 'Medium',
                audit_freq: 'Quarterly',
                last_audit_dt: '2024-05-20',
                next_audit_dt: '2024-08-20',
                strat_obj: 'Reduce operational costs by 8% while maintaining quality',
                key_init: 'Lean manufacturing implementation and automation',
                act_status: 'Inactive',
                created_at: '2023-12-15T00:00:00Z',
                updated_at: '2024-07-10T09:30:00Z'
            }
        ];

        console.log('Sample data loaded:', this.businessUnits.length, 'business units');
    }

    // Public method to reload data
    reloadData(): void {
        console.log('reloadData called manually');
        this.loadBusinessUnits();
    }

    private updateColumnConfiguration(columnHeaders: ColumnConfig[]): void {
        console.log('Updating column configuration from API:', columnHeaders);

        // Clear existing columns
        this.defaultColumns = [];
        this.selectableColumns = [];

        // Sort columns by seqNo (convert to number for sorting)
        const sortedColumns = columnHeaders.sort((a, b) => {
            const seqA = typeof a.seqNo === 'string' ? parseInt(a.seqNo) || 0 : a.seqNo || 0;
            const seqB = typeof b.seqNo === 'string' ? parseInt(b.seqNo) || 0 : b.seqNo || 0;
            return seqA - seqB;
        });

        // Separate columns by position
        sortedColumns.forEach(column => {
            if (column.position === 'default') {
                this.defaultColumns.push(column);
            } else if (column.position === 'dynamic') {
                this.selectableColumns.push(column);
            }
        });

        // Update all columns
        this.allColumns = [...this.defaultColumns, ...this.selectableColumns];

        console.log('Updated column configuration:', {
            defaultColumns: this.defaultColumns.length,
            selectableColumns: this.selectableColumns.length,
            totalColumns: this.allColumns.length
        });
    }

    private populateTypeOptions(): void {
        const types = [...new Set(this.businessUnits.map(bu => bu.bus_unit_type_name).filter(type => type))];
        this.typeOptions = [
            { content: 'All Types', value: '' },
            ...types.map(type => ({ content: type!, value: type! }))
        ];
    }

    private populateFormDropdownOptions(): void {
        // Populate organization options
        const organizations = [...new Set(this.businessUnits.map(bu => bu.org_id).filter(org => org))];
        this.organizationOptions = [
            { content: 'All Organizations', value: '' },
            ...organizations.map(org => ({ content: org, value: org }))
        ];

        // Populate parent business unit options
        const parentBusinessUnits = [...new Set(this.businessUnits.map(bu => ({
            id: bu.bus_unit_id,
            name: bu.bus_unit_name
        })).filter(bu => bu.id && bu.name))];

        this.parentBusinessUnitOptions = [
            { content: 'None', value: null },
            ...parentBusinessUnits.map(bu => ({ content: bu.name!, value: bu.id! }))
        ];

        // Populate business unit type options from actual data
        const distinctBusinessUnitTypes = [...new Set(this.businessUnits.map(bu => bu.bus_unit_type_name).filter(type => type && type.trim() !== ''))];
        if (distinctBusinessUnitTypes.length > 0) {
            this.businessUnitTypeOptions = [
                ...this.businessUnitTypeOptions.filter(option => option.content !== 'Operations'), // Remove defaults if we have real data
                ...distinctBusinessUnitTypes.map(type => ({ content: type!, value: type! }))
            ];
        }

        // Populate functional area options from actual data
        const distinctFunctionalAreas = [...new Set(this.businessUnits.map(bu => bu.func_area).filter(area => area && area.trim() !== ''))];
        if (distinctFunctionalAreas.length > 0) {
            this.functionalAreaOptions = [
                ...this.functionalAreaOptions.filter(option => option.content !== 'Core Business'), // Remove defaults if we have real data
                ...distinctFunctionalAreas.map(area => ({ content: area!, value: area! }))
            ];
        }

        console.log('Populated form dropdown options:', {
            organizations: this.organizationOptions,
            parentBusinessUnits: this.parentBusinessUnitOptions,
            businessUnitTypes: this.businessUnitTypeOptions,
            functionalAreas: this.functionalAreaOptions
        });
    }

    private getEmptyBusinessUnit(): BusinessUnit {
        return {
            org_id: '',
            bus_unit_code: '',
            bus_unit_name: '',
            act_status: 'Active',
            compl_cert: [],
            eff_start_dt: new Date().toISOString().split('T')[0], // Default to today
            // Initialize new fields with empty values
            website_url: '',
            social_med_links: '',
            mission_stmt: '',
            vision_stmt: '',
            business_obj: '',
            business_goals: '',
            total_emp_num: undefined,
            annual_rev_num: undefined,
            geo_footprint: '',
            regulatory_body_name: '',
            audit_firm: ''
        };
    }

    // Filter and search methods
    onSearchTermChange(value: string): void {
        this.searchTerm = value;
        this.applyFilters();
    }

    onStatusFilterChange(event: any): void {
        this.statusFilter = event.item.value;
        this.applyFilters();
    }

    onTypeFilterChange(event: any): void {
        this.typeFilter = event.item.value;
        this.applyFilters();
    }

    onOrganizationFilterChange(event: any): void {
        this.organizationFilter = event.item.value;
        this.applyFilters();
    }

    hasActiveFilters(): boolean {
        return !!(this.searchTerm || this.statusFilter || this.typeFilter || this.organizationFilter);
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.statusFilter = '';
        this.typeFilter = '';
        this.organizationFilter = '';
        this.applyFilters();
    }

    private applyFilters(): void {
        let filtered = [...this.businessUnits];

        // Apply search term filter
        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            filtered = filtered.filter(bu =>
                bu.bus_unit_name?.toLowerCase().includes(search) ||
                bu.bus_unit_code?.toLowerCase().includes(search) ||
                bu.bus_unit_head_name?.toLowerCase().includes(search) ||
                bu.bus_unit_desc?.toLowerCase().includes(search)
            );
        }

        // Apply status filter
        if (this.statusFilter) {
            filtered = filtered.filter(bu => bu.act_status === this.statusFilter);
        }

        // Apply type filter
        if (this.typeFilter) {
            filtered = filtered.filter(bu => bu.bus_unit_type_name === this.typeFilter);
        }

        // Apply organization filter
        if (this.organizationFilter) {
            filtered = filtered.filter(bu => bu.org_id === this.organizationFilter);
        }

        this.filteredBusinessUnits = filtered;
        this.totalItems = filtered.length;

        // Reset to first page when filters change
        this.currentPage = 1;
    }

    private updateSummary(): void {
        this.summaryData.total = this.businessUnits.length;
        this.summaryData.active = this.businessUnits.filter(bu => bu.act_status === 'Active').length;
        this.summaryData.inactive = this.businessUnits.filter(bu => bu.act_status === 'Inactive').length;

        // Recently added (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        this.summaryData.recentlyAdded = this.businessUnits.filter(bu => {
            if (!bu.created_at) return false;
            const createdDate = new Date(bu.created_at);
            return createdDate >= thirtyDaysAgo;
        }).length;
    }

    // Pagination methods
    get paginatedBusinessUnits(): BusinessUnit[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        return this.filteredBusinessUnits.slice(startIndex, endIndex);
    }

    onPageChange(page: number): void {
        this.currentPage = page;
    }

    // New pagination methods for custom pagination
    pageSizeOptions = [
        { content: '10', value: 10 },
        { content: '25', value: 25 },
        { content: '50', value: 50 },
        { content: '100', value: 100 }
    ];

    changePage(page: number): void {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
        }
    }

    changePageSize(size: number): void {
        this.pageSize = size;
        this.currentPage = 1; // Reset to first page
    }

    onPageSizeChange(event: any): void {
        const newSize = parseInt(event.target.value, 10);
        this.changePageSize(newSize);
    }

    getTotalPages(): number {
        return Math.ceil(this.filteredBusinessUnits.length / this.pageSize);
    }

    getCurrentPageRange(): string {
        if (this.filteredBusinessUnits.length === 0) {
            return '0 of 0';
        }

        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredBusinessUnits.length);

        return `${startIndex}-${endIndex} of ${this.filteredBusinessUnits.length}`;
    }

    // Selection methods
    selectAll(): void {
        this.selectedBusinessUnits = this.paginatedBusinessUnits.map(bu => bu.bus_unit_id || '');
    }

    clearSelection(): void {
        this.selectedBusinessUnits = [];
    }

    onSelectionChange(event: any, businessUnit: BusinessUnit): void {
        const isChecked = event.target.checked;
        const id = businessUnit.bus_unit_id || '';

        if (isChecked) {
            if (!this.selectedBusinessUnits.includes(id)) {
                this.selectedBusinessUnits.push(id);
            }
        } else {
            this.selectedBusinessUnits = this.selectedBusinessUnits.filter(selectedId => selectedId !== id);
        }
    }

    // CRUD operations
    addBusinessUnit(): void {
        console.log('Opening add business unit modal');
        this.isEditMode = false;
        this.isViewMode = false;
        this.currentBusinessUnit = this.getEmptyBusinessUnit();
        // Ensure dropdown options are populated before showing modal
        this.populateFormDropdownOptions();
        this.isAddEditModalOpen = true;
        console.log('Add modal state:', {
            isEditMode: this.isEditMode,
            isViewMode: this.isViewMode,
            isAddEditModalOpen: this.isAddEditModalOpen,
            currentBusinessUnit: this.currentBusinessUnit
        });
    }

    editBusinessUnit(businessUnit: BusinessUnit): void {
        this.currentBusinessUnit = { ...businessUnit };
        this.isViewMode = false;
        this.isEditMode = true;

        // Ensure dropdown options are populated before showing modal
        this.populateFormDropdownOptions();

        // Add a small delay to ensure Carbon UI dropdowns are properly initialized
        setTimeout(() => {
            this.isAddEditModalOpen = true;
        }, 50);

        // Log current business unit values for debugging
        console.log('Editing business unit:', this.currentBusinessUnit);
        console.log('Available form options after population:', {
            businessUnitTypes: this.businessUnitTypeOptions,
            functionalAreas: this.functionalAreaOptions,
            riskAssessment: this.riskAssessmentOptions,
            auditFrequency: this.auditFrequencyOptions,
            activityStatus: this.activityStatusOptions,
            geographicFootprint: this.geographicFootprintOptions
        });
    }

    viewBusinessUnit(businessUnit: BusinessUnit): void {
        this.currentBusinessUnit = { ...businessUnit };
        this.isViewMode = true;
        this.isEditMode = false;

        // Ensure dropdown options are populated before showing modal
        this.populateFormDropdownOptions();

        // Add a small delay to ensure Carbon UI dropdowns are properly initialized
        setTimeout(() => {
            this.isAddEditModalOpen = true;
        }, 50);
    }

    closeAddEditModal(): void {
        this.isAddEditModalOpen = false;
        this.currentBusinessUnit = this.getEmptyBusinessUnit();
        this.isViewMode = false;
        this.isEditMode = false;
    }

    saveBusinessUnit(): void {
        console.log('Save business unit called');
        console.log('Current business unit data:', this.currentBusinessUnit);
        console.log('Org ID specifically:', this.currentBusinessUnit.org_id);
        console.log('Org ID type:', typeof this.currentBusinessUnit.org_id);
        console.log('Org ID is truthy:', !!this.currentBusinessUnit.org_id);

        // Validate required fields
        if (!this.currentBusinessUnit.bus_unit_code?.trim()) {
            console.error('Business Unit Code is required');
            alert('Business Unit Code is required');
            return;
        }

        if (!this.currentBusinessUnit.bus_unit_name?.trim()) {
            console.error('Business Unit Name is required');
            alert('Business Unit Name is required');
            return;
        }

        if (!this.currentBusinessUnit.org_id || this.currentBusinessUnit.org_id.trim() === '') {
            console.error('Organization ID is required. Current value:', this.currentBusinessUnit.org_id);
            alert('Please select an Organization');
            return;
        }

        if (this.isEditMode) {
            // Update existing business unit
            console.log('Updating business unit with ID:', this.currentBusinessUnit.bus_unit_id);

            const updateData = {
                ...this.currentBusinessUnit,
                updated_at: new Date().toISOString(),
                updated_by: this.authService.getCurrentUser()?.username || 'system'
            };

            // Handle compliance certifications for update
            if (updateData.compl_cert && Array.isArray(updateData.compl_cert)) {
                (updateData as any).compl_cert = JSON.stringify(updateData.compl_cert);
            }

            this.dynamicFormCrudService.update('businessunitForm', this.currentBusinessUnit.bus_unit_id!, updateData).subscribe({
                next: (response) => {
                    console.log('Business unit updated successfully:', response);
                    const index = this.businessUnits.findIndex(bu => bu.bus_unit_id === this.currentBusinessUnit.bus_unit_id);
                    if (index !== -1) {
                        this.businessUnits[index] = { ...response };
                    }
                    this.applyFilters();
                    this.updateSummary();
                    this.closeAddEditModal();
                },
                error: (error) => {
                    console.error('Error updating business unit:', error);
                    console.error('Error details:', {
                        status: error.status,
                        statusText: error.statusText,
                        message: error.message,
                        error: error.error
                    });

                    // Handle authentication errors
                    if (error.status === 401) {
                        console.log('Unauthorized error during update - redirecting to login');
                        this.authService.logoutAndRedirect();
                        return;
                    }

                    // Show error message to user
                    alert('Error updating business unit: ' + (error.error?.message || error.message || 'Unknown error'));
                }
            });
        } else {
            // Create new business unit  
            console.log('Creating new business unit');
            console.log('Raw org_id before assignment:', this.currentBusinessUnit.org_id);

            // Since the dynamic form service is filtering out org_id, try with all required fields
            const createData = {
                tenant_id: this.authService.getCurrentUser()?.tenantId || 'default',
                access_group_id: this.authService.getCurrentUser()?.accessGroupId || 'default',
                org_id: this.currentBusinessUnit.org_id?.trim(),
                parent_bus_unit_id: this.currentBusinessUnit.parent_bus_unit_id || null,
                bus_unit_code: this.currentBusinessUnit.bus_unit_code?.trim(),
                bus_unit_name: this.currentBusinessUnit.bus_unit_name?.trim(),
                curr_rec_ind: 'Y',
                act_status: 'Active',
                eff_start_dt: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: this.authService.getCurrentUser()?.username || 'system',
                updated_by: this.authService.getCurrentUser()?.username || 'system'
            };

            console.log('=== COMPLETE DATA WITH ORG_ID ===');
            console.log('createData object:', createData);
            console.log('createData.org_id:', createData.org_id);
            console.log('All fields being sent:', Object.keys(createData));
            console.log('JSON.stringify(createData):', JSON.stringify(createData, null, 2));
            console.log('Field names being sent:', Object.keys(createData));
            console.log('=== END ANALYSIS ===');

            this.dynamicFormCrudService.create('businessunitForm', createData).subscribe({
                next: (response) => {
                    console.log('Business unit created successfully:', response);
                    console.log('API Response:', response);
                    // Add the new business unit to the list
                    this.businessUnits.push({ ...response });
                    this.applyFilters();
                    this.updateSummary();
                    this.closeAddEditModal();

                    // Show success message
                    console.log('Business unit created successfully!');
                    alert('Business unit created successfully!');
                },
                error: (error) => {
                    console.error('Error creating business unit:', error);
                    console.error('Full error object:', JSON.stringify(error, null, 2));
                    console.error('Error details:', {
                        status: error.status,
                        statusText: error.statusText,
                        message: error.message,
                        error: error.error,
                        url: error.url
                    });

                    // Handle authentication errors
                    if (error.status === 401) {
                        console.log('Unauthorized error during create - redirecting to login');
                        this.authService.logoutAndRedirect();
                        return;
                    }

                    // Show detailed error message to user
                    let errorMessage = 'Error creating business unit: ';
                    if (error.error?.message) {
                        errorMessage += error.error.message;
                    } else if (error.error?.error) {
                        errorMessage += error.error.error;
                    } else if (error.message) {
                        errorMessage += error.message;
                    } else {
                        errorMessage += 'Unknown error occurred. Please check the console for details.';
                    }

                    console.log('Displaying error to user:', errorMessage);
                    alert(errorMessage);
                }
            });
        }
    }

    deleteBusinessUnit(businessUnit: BusinessUnit): void {
        this.selectedBusinessUnit = businessUnit;
        this.showDeleteModal = true;
    }

    confirmDelete(): void {
        console.log('Deleting business unit:', this.selectedBusinessUnit);

        this.dynamicFormCrudService.delete('businessunitForm', this.selectedBusinessUnit.bus_unit_id!).subscribe({
            next: (response) => {
                console.log('Business unit deleted successfully:', response);
                this.businessUnits = this.businessUnits.filter(bu => bu.bus_unit_id !== this.selectedBusinessUnit.bus_unit_id);
                this.applyFilters();
                this.updateSummary();
                this.showDeleteModal = false;
                alert('Business unit deleted successfully!');
            },
            error: (error) => {
                console.error('Error deleting business unit:', error);
                console.error('Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    error: error.error
                });

                // Handle authentication errors
                if (error.status === 401) {
                    console.log('Unauthorized error during delete - redirecting to login');
                    this.authService.logoutAndRedirect();
                    return;
                }

                // Show error message to user
                alert('Error deleting business unit: ' + (error.error?.message || error.message || 'Unknown error'));
            }
        });
    }

    // Column management
    openColumnModal(): void {
        // Initialize temp visible columns with current state
        this.tempVisibleColumns = { ...this.visibleColumns };

        // Ensure all optional columns have values in tempVisibleColumns
        this.getOptionalColumns().forEach(col => {
            if (!(col.key in this.tempVisibleColumns)) {
                this.tempVisibleColumns[col.key] = false;
            }
        });

        // Ensure all default columns are marked as visible in tempVisibleColumns
        this.getDefaultColumns().forEach(col => {
            this.tempVisibleColumns[col.key] = true;
        });

        this.showColumnModal = true;
    }

    closeColumnModal(): void {
        this.showColumnModal = false;
        this.tempVisibleColumns = {};
    }

    getDefaultColumns(): Array<{ key: string, label: string }> {
        return this.defaultColumns.map(col => ({
            key: col.uiElementId,
            label: col.uiElementLabel
        }));
    }

    getOptionalColumns(): Array<{ key: string, label: string, description: string }> {
        return this.selectableColumns.map(col => ({
            key: col.uiElementId,
            label: col.uiElementLabel,
            description: `${col.uiElementLabel} information`
        }));
    }

    updateTempColumn(columnKey: string, event: any): void {
        const isChecked = event.target.checked;
        this.tempVisibleColumns[columnKey] = isChecked;
    }

    toggleTempColumn(columnKey: string): void {
        this.tempVisibleColumns[columnKey] = !this.tempVisibleColumns[columnKey];
    }

    trackByColumnKey(index: number, item: any): string {
        return item.key;
    }

    resetToDefaults(): void {
        const defaultVisible: any = {};
        this.getDefaultColumns().forEach(col => {
            defaultVisible[col.key] = true;
        });
        this.getOptionalColumns().forEach(col => {
            defaultVisible[col.key] = false;
        });
        this.tempVisibleColumns = { ...defaultVisible };
    }

    saveColumnPreferences(): void {
        // Update visible columns with temp values
        this.visibleColumns = { ...this.tempVisibleColumns };

        // Only save selectable column preferences to localStorage (not default columns)
        const selectablePreferences: { [key: string]: boolean } = {};
        this.selectableColumns.forEach(col => {
            selectablePreferences[col.uiElementId] = this.tempVisibleColumns[col.uiElementId] || false;
        });

        // Save to localStorage
        localStorage.setItem('businessUnitsColumnPreferences', JSON.stringify(selectablePreferences));

        this.closeColumnModal();
    }

    onColumnVisibilityChange(columnId: string, visible: boolean): void {
        this.visibleColumns[columnId] = visible;
    }

    getVisibleColumns(): ColumnConfig[] {
        return this.allColumns.filter(col => this.visibleColumns[col.uiElementId]);
    }

    // Compliance certification management
    addCertification(): void {
        if (!this.currentBusinessUnit.compl_cert) {
            this.currentBusinessUnit.compl_cert = [];
        }

        const newCert: ComplianceCertification = {
            id: 'cert_' + Date.now(),
            name: ''
        };

        this.currentBusinessUnit.compl_cert.push(newCert);
    }

    removeCertification(certId: string): void {
        if (this.currentBusinessUnit.compl_cert) {
            this.currentBusinessUnit.compl_cert = this.currentBusinessUnit.compl_cert.filter(cert => cert.id !== certId);
        }
    }

    onCertificationFileChange(event: any, certId: string): void {
        const file = event.target.files[0];
        if (file && this.currentBusinessUnit.compl_cert) {
            const cert = this.currentBusinessUnit.compl_cert.find(c => c.id === certId);
            if (cert) {
                cert.fileName = file.name;
                cert.uploadDate = new Date().toISOString();

                // Convert file to base64 for storage
                const reader = new FileReader();
                reader.onload = () => {
                    cert.fileData = reader.result as string;
                };
                reader.readAsDataURL(file);
            }
        }
    }

    downloadCertification(cert: ComplianceCertification): void {
        if (cert.fileData) {
            const link = document.createElement('a');
            link.href = cert.fileData;
            link.download = cert.fileName || 'certificate';
            link.click();
        }
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
