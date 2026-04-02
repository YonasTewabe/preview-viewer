import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { userService } from '../services/userService';

// Query keys
export const USER_QUERY_KEYS = {
  all: ['users'],
  lists: () => [...USER_QUERY_KEYS.all, 'list'],
  list: (filters) => [...USER_QUERY_KEYS.lists(), filters],
  details: () => [...USER_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...USER_QUERY_KEYS.details(), id],
};

// Hook to fetch all users
export const useUsers = (params = {}) => {
  const { message } = App.useApp();
  
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(params),
    queryFn: () => userService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    }
  });
};

// Hook to fetch a single user
export const useUser = (id) => {
  const { message } = App.useApp();
  
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      console.error('Error fetching user:', error);
      message.error('Failed to fetch user details');
    }
  });
};

// Hook to create a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      // Optionally add the new user to the cache
      queryClient.setQueryData(USER_QUERY_KEYS.detail(newUser.id), newUser);
      
      // Show success message with email notification
      if (newUser.emailSent) {
        message.success(
          `User created successfully! Welcome email sent to ${newUser.email}`,
          5 // Show for 5 seconds
        );
      } else {
        message.success('User created successfully');
        message.warning('Welcome email could not be sent', 3);
      }
    },
    onError: (error) => {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create user';
      message.error(errorMessage);
    }
  });
};

// Hook to update a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, ...userData }) => userService.updateUser(id, userData),
    onSuccess: (updatedUser) => {
      // Update the specific user in cache
      queryClient.setQueryData(USER_QUERY_KEYS.detail(updatedUser.id), updatedUser);
      
      // Invalidate users list to reflect changes
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      message.success('User updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      message.error(errorMessage);
    }
  });
};

// Hook to delete a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: (_, deletedUserId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.detail(deletedUserId) });
      
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      message.success('User deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      message.error(errorMessage);
    }
  });
};

// Hook to update user status
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, status }) => userService.updateUserStatus(id, status),
    onSuccess: (updatedUser) => {
      // Update the specific user in cache
      queryClient.setQueryData(USER_QUERY_KEYS.detail(updatedUser.id), updatedUser);
      
      // Invalidate users list to reflect changes
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      message.success('User status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update user status';
      message.error(errorMessage);
    }
  });
};

// Hook for searching users
export const useSearchUsers = (searchTerm) => {
  const { message } = App.useApp();
  
  return useQuery({
    queryKey: [...USER_QUERY_KEYS.all, 'search', searchTerm],
    queryFn: () => userService.searchUsers(searchTerm),
    enabled: !!searchTerm && searchTerm.length > 2,
    staleTime: 30 * 1000, // 30 seconds
    onError: (error) => {
      console.error('Error searching users:', error);
      message.error('Failed to search users');
    }
  });
};

// Hook to resend welcome email
export const useResendWelcomeEmail = () => {
  const { message } = App.useApp();
  
  return useMutation({
    mutationFn: userService.resendWelcomeEmail,
    onSuccess: (result) => {
      message.success(result.message || 'Welcome email sent successfully');
      if (result.previewUrl) {
        console.log('Email preview URL:', result.previewUrl);
      }
    },
    onError: (error) => {
      console.error('Error resending welcome email:', error);
      const errorMessage = error.response?.data?.error || 'Failed to resend welcome email';
      message.error(errorMessage);
    }
  });
};

// Hook to test email functionality
export const useTestEmail = () => {
  const { message } = App.useApp();
  
  return useMutation({
    mutationFn: userService.testEmail,
    onSuccess: (result) => {
      message.success('Test email sent successfully');
      if (result.previewUrl) {
        console.log('Email preview URL:', result.previewUrl);
      }
    },
    onError: (error) => {
      console.error('Error sending test email:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send test email';
      message.error(errorMessage);
    }
  });
};

// Password change hook
export const useChangePassword = () => {
  const { message } = App.useApp();
  
  return useMutation({
    mutationFn: ({ userId, passwordData }) => userService.changePassword(userId, passwordData),
    onSuccess: (data) => {
      message.success('Password changed successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      message.error(errorMessage);
    },
  });
};