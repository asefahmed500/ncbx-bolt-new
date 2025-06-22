import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/use-toast';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const { 
    signUp, 
    signIn, 
    signInWithGoogle, 
    resetPassword, 
    resendConfirmation,
    loading, 
    error 
  } = useAuth();
  
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (successMessage) setSuccessMessage('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!isLogin && !showForgotPassword && !formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!showForgotPassword) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (!isLogin && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (showForgotPassword) {
        const result = await resetPassword(formData.email);
        if (result.success) {
          setSuccessMessage(result.message || 'Password reset email sent!');
          toast({
            title: "Reset email sent",
            description: result.message || 'Password reset email sent!',
          });
          setShowForgotPassword(false);
        } else {
          setErrors({ email: result.error || 'Failed to send reset email' });
          toast({
            title: "Reset failed",
            description: result.error || 'Failed to send reset email',
            variant: "destructive",
          });
        }
        return;
      }

      if (isLogin) {
        const result = await signIn(formData.email, formData.password);
        if (!result.success) {
          setErrors({ general: result.error || 'Failed to sign in' });
          toast({
            title: "Sign in failed",
            description: result.error || 'Failed to sign in',
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in",
          });
        }
      } else {
        const result = await signUp(formData.email, formData.password, formData.name);
        if (result.success) {
          if (result.needsVerification) {
            setPendingEmail(formData.email);
            setShowEmailVerification(true);
            setSuccessMessage(result.message || 'Please check your email for verification');
            toast({
              title: "Verification needed",
              description: result.message || 'Please check your email for verification',
            });
          } else {
            setSuccessMessage('Account created successfully!');
            toast({
              title: "Account created",
              description: "Your account has been created successfully!",
            });
          }
        } else {
          setErrors({ general: result.error || 'Failed to sign up' });
          toast({
            title: "Sign up failed",
            description: result.error || 'Failed to sign up',
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred' });
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (!result.success) {
      setErrors({ general: result.error || 'Failed to sign in with Google' });
      toast({
        title: "Google sign in failed",
        description: result.error || 'Failed to sign in with Google',
        variant: "destructive",
      });
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return;
    
    const result = await resendConfirmation(pendingEmail);
    if (result.success) {
      setSuccessMessage(result.message || 'Confirmation email sent!');
      toast({
        title: "Email sent",
        description: result.message || 'Confirmation email sent!',
      });
    } else {
      setErrors({ general: result.error || 'Failed to resend confirmation' });
      toast({
        title: "Failed to resend",
        description: result.error || 'Failed to resend confirmation',
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setSuccessMessage('');
    setShowEmailVerification(false);
    setPendingEmail('');
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    resetForm();
    if (newMode === 'forgot') {
      setShowForgotPassword(true);
    } else {
      setShowForgotPassword(false);
      setIsLogin(newMode === 'login');
    }
  };

  // Email verification view
  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600">
              We've sent a verification link to <strong>{pendingEmail}</strong>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                {successMessage && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <p className="text-green-700 text-sm">{successMessage}</p>
                  </div>
                )}

                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{errors.general}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Didn't receive the email?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Check your spam folder or click below to resend
                    </p>
                    <Button
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      className="w-full flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend verification email
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => switchMode('login')}
                      variant="link"
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Back to sign in
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {showForgotPassword 
              ? 'Reset your password' 
              : isLogin 
                ? 'Welcome back' 
                : 'Create your account'
            }
          </h2>
          <p className="text-gray-600">
            {showForgotPassword
              ? 'Enter your email to receive a password reset link'
              : isLogin 
                ? 'Sign in to continue building amazing websites' 
                : 'Join thousands of creators building with NCBX'
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              {/* Error Message */}
              {(error || errors.general) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error || errors.general}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <p className="text-green-700 text-sm">{successMessage}</p>
                </div>
              )}

              {/* Social Login - Only show for login/signup */}
              {!showForgotPassword && (
                <>
                  <div className="space-y-3 mb-6">
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      variant="outline"
                      className="w-full flex items-center justify-center"
                    >
                      <div className="w-5 h-5 mr-3 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        G
                      </div>
                      Continue with Google
                    </Button>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                  </div>
                </>
              )}

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && !showForgotPassword && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {!showForgotPassword && (
                  <>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.password ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                      {!isLogin && (
                        <p className="mt-1 text-xs text-gray-500">
                          Password must be at least 6 characters long
                        </p>
                      )}
                    </div>

                    {!isLogin && (
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Confirm your password"
                          />
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                      </div>
                    )}
                  </>
                )}

                {isLogin && !showForgotPassword && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <Button 
                      type="button" 
                      onClick={() => switchMode('forgot')}
                      variant="link"
                      className="text-sm text-blue-600 hover:text-blue-500 p-0 h-auto"
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {showForgotPassword 
                        ? 'Send reset email' 
                        : isLogin 
                          ? 'Sign in' 
                          : 'Create account'
                      }
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                {showForgotPassword ? (
                  <p className="text-gray-600">
                    Remember your password?{' '}
                    <Button
                      onClick={() => switchMode('login')}
                      variant="link"
                      className="text-blue-600 hover:text-blue-500 font-medium p-0 h-auto"
                    >
                      Sign in
                    </Button>
                  </p>
                ) : (
                  <p className="text-gray-600">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <Button
                      onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                      variant="link"
                      className="text-blue-600 hover:text-blue-500 font-medium p-0 h-auto"
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </Button>
                  </p>
                )}
              </div>

              {!isLogin && !showForgotPassword && (
                <p className="mt-4 text-xs text-gray-500 text-center">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;