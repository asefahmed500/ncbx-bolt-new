import React from 'react';
import { ArrowRight, Zap, Palette, Users, Globe, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

const LandingPage: React.FC = () => {
  const { setCurrentView } = useAppStore();

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-blue-600" />,
      title: "Lightning Fast",
      description: "Build stunning websites in minutes, not hours. Our intuitive drag-and-drop interface makes website creation effortless."
    },
    {
      icon: <Palette className="h-6 w-6 text-purple-600" />,
      title: "Beautiful Templates",
      description: "Choose from hundreds of professionally designed templates, all fully customizable to match your brand."
    },
    {
      icon: <Users className="h-6 w-6 text-green-600" />,
      title: "Team Collaboration",
      description: "Work together in real-time with your team. See live cursors, comments, and changes as they happen."
    },
    {
      icon: <Globe className="h-6 w-6 text-orange-600" />,
      title: "Global Publishing",
      description: "Publish to custom domains instantly with built-in CDN, SSL certificates, and lightning-fast performance."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "1 website",
        "Basic templates",
        "Subdomain hosting",
        "5GB storage",
        "Community support"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "For creators and small businesses",
      features: [
        "Unlimited websites",
        "Premium templates",
        "Custom domains",
        "100GB storage",
        "Priority support",
        "Advanced analytics",
        "Team collaboration"
      ],
      popular: true
    },
    {
      name: "Business",
      price: "$39",
      period: "per month",
      description: "For growing businesses",
      features: [
        "Everything in Pro",
        "White-label solution",
        "Advanced integrations",
        "500GB storage",
        "24/7 phone support",
        "Custom templates",
        "API access"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Freelance Designer",
      avatar: "SJ",
      rating: 5,
      text: "NCBX has revolutionized how I create websites for my clients. The collaboration features are incredible!"
    },
    {
      name: "Mike Chen",
      role: "Startup Founder",
      avatar: "MC",
      rating: 5,
      text: "We launched our landing page in under an hour. The templates are beautiful and the editor is so intuitive."
    },
    {
      name: "Lisa Rodriguez",
      role: "Marketing Director",
      avatar: "LR",
      rating: 5,
      text: "Our team can now create and update our websites without any developer help. It's a game changer."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Now with AI-powered templates
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Build stunning websites
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}without code
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create professional websites in minutes with our intuitive drag-and-drop builder. 
                No coding skills required - just your creativity and vision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setCurrentView('auth')}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Start building for free
                  <ArrowRight className="inline h-5 w-5 ml-2" />
                </button>
                <button
                  onClick={() => setCurrentView('templates')}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  View templates
                </button>
              </div>
              <div className="flex items-center mt-8 text-sm text-gray-500">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                No credit card required
                <Check className="h-4 w-4 text-green-500 mr-2 ml-6" />
                Free forever plan
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="p-6">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 mb-4">
                    <div className="w-full h-4 bg-blue-200 rounded mb-2"></div>
                    <div className="w-3/4 h-4 bg-purple-200 rounded"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-100 rounded-lg h-24"></div>
                    <div className="bg-gray-100 rounded-lg h-24"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-gray-200 rounded"></div>
                    <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
                    <div className="w-4/6 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Live Preview
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to build amazing websites
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From design to deployment, we've got you covered with powerful features 
              that make website creation simple and enjoyable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by creators worldwide
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of happy users who've transformed their web presence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-xl p-8"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your needs. Always know what you'll pay.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setCurrentView('auth')}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to build your dream website?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of creators who've already transformed their online presence with NCBX.
            </p>
            <button
              onClick={() => setCurrentView('auth')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Start building for free
              <ArrowRight className="inline h-5 w-5 ml-2" />
            </button>
            <p className="text-blue-100 text-sm mt-4">
              No credit card required • Free forever plan • 5-minute setup
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;