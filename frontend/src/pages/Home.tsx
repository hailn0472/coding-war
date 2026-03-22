import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { H1, H2, P, Lead, Code } from '@/components/ui/Typography';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { SearchInput } from '@/components/forms/SearchInput';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { FileUpload } from '@/components/forms/FileUpload';
import { DataTable } from '@/components/tables/DataTable';
import { ResponsiveTable } from '@/components/tables/ResponsiveTable';
import {
  Modal,
  ConfirmDialog,
  AlertDialog,
  FormModal,
} from '@/components/ui/Modal';
import { useModal } from '@/hooks/useModal';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToastContext } from '@/contexts/ToastContext';
import ActivityFeed from '@/components/Activity/ActivityFeed';
import JudgeStatusMonitor from '@/components/Judge/JudgeStatusMonitor';
import { User, Mail, Lock, Clock, Users } from 'lucide-react';

const Home: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  // Suppress unused variable warning for demo purposes
  console.log('Demo files:', files.length);

  // Modal hooks
  const basicModal = useModal();
  const formModal = useModal();
  const [alertOpen, setAlertOpen] = useState(false);
  const confirmDialog = useConfirmDialog();

  // Toast context
  const toast = useToastContext();

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'rust', label: 'Rust' },
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  // Sample data for table demos
  const sampleProblems = [
    {
      id: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      points: 100,
      solved: 1234,
      acceptance: '45.2%',
    },
    {
      id: 2,
      title: 'Binary Search',
      difficulty: 'Medium',
      points: 200,
      solved: 856,
      acceptance: '62.1%',
    },
    {
      id: 3,
      title: 'Graph Traversal',
      difficulty: 'Hard',
      points: 300,
      solved: 234,
      acceptance: '28.7%',
    },
    {
      id: 4,
      title: 'Dynamic Programming',
      difficulty: 'Hard',
      points: 350,
      solved: 156,
      acceptance: '22.3%',
    },
    {
      id: 5,
      title: 'Array Manipulation',
      difficulty: 'Easy',
      points: 150,
      solved: 2341,
      acceptance: '58.9%',
    },
  ];

  const sampleContests = [
    {
      id: 1,
      name: 'Weekly Contest 1',
      participants: 1234,
      duration: '2h',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Monthly Challenge',
      participants: 5678,
      duration: '3h',
      status: 'Upcoming',
    },
    {
      id: 3,
      name: 'Algorithm Sprint',
      participants: 890,
      duration: '1.5h',
      status: 'Ended',
    },
  ];

  const problemColumns = [
    { key: 'id' as const, header: 'ID', sortable: true },
    { key: 'title' as const, header: 'Title', sortable: true },
    {
      key: 'difficulty' as const,
      header: 'Difficulty',
      sortable: true,
      render: (value: any) => (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            value === 'Easy'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : value === 'Medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {value}
        </span>
      ),
    },
    { key: 'points' as const, header: 'Points', sortable: true },
    { key: 'solved' as const, header: 'Solved', sortable: true },
    { key: 'acceptance' as const, header: 'Acceptance', sortable: true },
  ];

  const contestColumns = [
    { key: 'name' as const, header: 'Contest Name', priority: 1 },
    {
      key: 'participants' as const,
      header: 'Participants',
      priority: 2,
      mobileLabel: 'Participants',
      render: (value: any) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {Number(value).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'duration' as const,
      header: 'Duration',
      priority: 3,
      render: (value: any) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {value}
        </div>
      ),
    },
    {
      key: 'status' as const,
      header: 'Status',
      priority: 4,
      render: (value: any) => (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            value === 'Active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : value === 'Upcoming'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {value}
        </span>
      ),
    },
  ];
  return (
    <div className="container mx-auto py-8">
      <div className="text-center">
        <H1 className="mb-4">Welcome to Coding War</H1>
        <Lead className="mb-8">
          A modern online judge platform for competitive programming
        </Lead>

        {/* Theme Demo Section */}
        <div className="bg-card mb-12 rounded-lg border p-6 text-left">
          <H2 className="mb-4">Theme System Demo</H2>
          <P>
            This platform supports light, dark, and system themes. Use the theme
            toggle in the header to switch between modes.
          </P>
          <P>
            The theme system uses CSS custom properties and React Context for
            efficient theme switching with <Code>localStorage</Code>{' '}
            persistence.
          </P>
        </div>

        {/* Modal & Toast Demo */}
        <div className="bg-card mb-12 rounded-lg border p-6 text-left">
          <H2 className="mb-6">Modal & Toast System Demo</H2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Modal Demos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Modal Components</h3>

              <div className="space-y-2">
                <button
                  onClick={basicModal.open}
                  className="btn btn-primary btn-md w-full"
                >
                  Open Basic Modal
                </button>

                <button
                  onClick={() => setAlertOpen(true)}
                  className="btn btn-secondary btn-md w-full"
                >
                  Show Alert Dialog
                </button>

                <button
                  onClick={async () => {
                    const confirmed = await confirmDialog.showConfirm({
                      title: 'Delete Item',
                      message:
                        'Are you sure you want to delete this item? This action cannot be undone.',
                      confirmText: 'Delete',
                      cancelText: 'Cancel',
                      variant: 'danger',
                    });

                    if (confirmed) {
                      toast.success('Item deleted successfully!');
                    } else {
                      toast.info('Deletion cancelled');
                    }
                  }}
                  className="btn btn-outline btn-md w-full"
                >
                  Show Confirm Dialog
                </button>

                <button
                  onClick={formModal.open}
                  className="btn btn-ghost btn-md w-full"
                >
                  Open Form Modal
                </button>
              </div>
            </div>

            {/* Toast Demos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Toast Notifications</h3>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    toast.success('Operation completed successfully!')
                  }
                  className="btn btn-primary btn-md w-full"
                >
                  Success Toast
                </button>

                <button
                  onClick={() =>
                    toast.error('Something went wrong. Please try again.')
                  }
                  className="btn btn-secondary btn-md w-full"
                >
                  Error Toast
                </button>

                <button
                  onClick={() =>
                    toast.warning('This action requires confirmation.')
                  }
                  className="btn btn-outline btn-md w-full"
                >
                  Warning Toast
                </button>

                <button
                  onClick={() => toast.info('New features are now available!')}
                  className="btn btn-ghost btn-md w-full"
                >
                  Info Toast
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Components Demo */}
        <div className="bg-card mb-12 rounded-lg border p-6 text-left">
          <H2 className="mb-6">Form Components Demo</H2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Basic Input Components */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Components</h3>

              <Input
                label="Username"
                placeholder="Enter your username"
                leftIcon={<User className="h-4 w-4" />}
                helperText="Must be 3-20 characters"
              />

              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                leftIcon={<Mail className="h-4 w-4" />}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                leftIcon={<Lock className="h-4 w-4" />}
              />

              <Select
                label="Difficulty"
                placeholder="Select difficulty"
                options={difficultyOptions}
              />

              <Textarea
                label="Description"
                placeholder="Enter description..."
                rows={3}
              />

              <Checkbox
                label="I agree to the terms and conditions"
                description="By checking this box, you agree to our terms of service"
              />
            </div>

            {/* Advanced Components */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Components</h3>

              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search problems..."
              />

              <MultiSelect
                label="Programming Languages"
                options={languageOptions}
                value={selectedLanguages}
                onChange={setSelectedLanguages}
                placeholder="Select languages..."
              />

              <FileUpload
                label="Upload Files"
                accept=".txt,.pdf,.doc,.docx"
                multiple
                maxSize={10 * 1024 * 1024} // 10MB
                onFilesChange={setFiles}
              />
            </div>
          </div>
        </div>

        {/* Table Components Demo */}
        <div className="bg-card mb-12 rounded-lg border p-6 text-left">
          <H2 className="mb-6">Table Components Demo</H2>

          <div className="space-y-8">
            {/* Data Table with Pagination and Search */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Problems Table (Sortable, Searchable, Paginated)
              </h3>
              <DataTable
                data={sampleProblems}
                columns={problemColumns}
                searchable
                searchPlaceholder="Search problems..."
                searchKeys={['title', 'difficulty']}
                paginated
                pageSize={3}
                pageSizeOptions={[3, 5, 10]}
                defaultSort={{ key: 'points', direction: 'desc' }}
                onRowClick={row => console.log('Clicked problem:', row)}
              />
            </div>

            {/* Responsive Table */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Contests Table (Responsive Design)
              </h3>
              <ResponsiveTable
                data={sampleContests}
                columns={contestColumns}
                onRowClick={row => console.log('Clicked contest:', row)}
                mobileBreakpoint="lg"
              />
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <ActivityFeed className="bg-card rounded-lg border p-6" />
          </div>

          {/* Judge Status */}
          <div>
            <JudgeStatusMonitor className="bg-card rounded-lg border p-6" />
          </div>
        </div>

        {/* Platform Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Problems</h3>
              <p className="card-description">
                Solve challenging programming problems
              </p>
            </div>
            <div className="card-content">
              <p className="text-2xl font-bold text-primary-600">1,000+</p>
              <p className="text-muted-foreground text-sm">
                Available Problems
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Contests</h3>
              <p className="card-description">
                Participate in competitive programming contests
              </p>
            </div>
            <div className="card-content">
              <p className="text-2xl font-bold text-primary-600">50+</p>
              <p className="text-muted-foreground text-sm">Active Contests</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Users</h3>
              <p className="card-description">
                Join a community of programmers
              </p>
            </div>
            <div className="card-content">
              <p className="text-2xl font-bold text-primary-600">10,000+</p>
              <p className="text-muted-foreground text-sm">Registered Users</p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link to="/problems" className="btn btn-primary btn-lg mr-4">
            Start Solving
          </Link>
          <Link to="/contests" className="btn btn-outline btn-lg">
            View Contests
          </Link>
        </div>
      </div>

      {/* Modal Components */}
      <Modal
        isOpen={basicModal.isOpen}
        onClose={basicModal.close}
        title="Basic Modal Example"
        size="md"
      >
        <div className="space-y-4">
          <P>
            This is a basic modal component with a title, content area, and
            close functionality. You can close it by clicking the X button,
            pressing Escape, or clicking outside.
          </P>
          <P>
            The modal includes focus trapping, accessibility features, and
            smooth animations.
          </P>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={basicModal.close}
              className="btn btn-outline btn-md"
            >
              Close
            </button>
            <button
              onClick={basicModal.close}
              className="btn btn-primary btn-md"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>

      <AlertDialog
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Information"
        message="This is an alert dialog. It's used to display important information to users."
        variant="info"
        buttonText="Understood"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.options?.title}
        message={confirmDialog.options?.message || ''}
        confirmText={confirmDialog.options?.confirmText}
        cancelText={confirmDialog.options?.cancelText}
        variant={confirmDialog.options?.variant}
        loading={confirmDialog.loading}
      />

      <FormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        title="Edit Profile"
        onSubmit={() => {
          // Simulate form submission
          setTimeout(() => {
            toast.success('Profile updated successfully!');
            formModal.close();
          }, 1000);
        }}
        submitText="Save Changes"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            defaultValue="John Doe"
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            defaultValue="john@example.com"
          />
          <Textarea
            label="Bio"
            placeholder="Tell us about yourself..."
            rows={4}
            defaultValue="I'm a passionate programmer who loves solving challenging problems."
          />
          <Select
            label="Preferred Language"
            options={[
              { value: 'javascript', label: 'JavaScript' },
              { value: 'python', label: 'Python' },
              { value: 'java', label: 'Java' },
              { value: 'cpp', label: 'C++' },
            ]}
            defaultValue="javascript"
          />
        </div>
      </FormModal>
    </div>
  );
};

export default Home;
