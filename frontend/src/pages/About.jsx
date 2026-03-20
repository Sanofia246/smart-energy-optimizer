import { Brain, Leaf, Zap, BookOpen, Users, MapPin, ExternalLink } from 'lucide-react'

export default function About() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">About This Project</h1>
        <p className="text-sm text-gray-400 mt-0.5">Smart Resource Optimization System for Home Appliances Using AI</p>
      </div>

      {/* Project badge */}
      <div className="bg-gradient-to-r from-blue-900/40 to-green-900/20 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center shrink-0">
            <Leaf size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Smart Resource Optimization System</h2>
            <p className="text-sm text-gray-400 mt-1">for Home Appliances Using AI · Phase 1 Report Implementation</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <MapPin size={11} /><span>Avinashilingam Institute, Coimbatore – 641108</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Prophet', 'XGBoost', 'React + Vite', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'TNEB Dataset'].map(t => (
                <span key={t} className="bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full text-xs">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Users size={15} className="text-gray-400" />
          <h2 className="font-semibold text-white text-sm">Project Team</h2>
        </div>
        <div className="card-body grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Harshetha V', roll: '22UEA006' },
            { name: 'Monisha M', roll: '22UEA013' },
            { name: 'Nargese Banu S', roll: '22UEA014' },
            { name: 'Taj Sanofia S', roll: '22UEA032' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-2 text-white font-bold text-sm">
                {s.name.charAt(0)}
              </div>
              <p className="text-white text-sm font-medium">{s.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.roll}</p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500">Guide: <span className="text-gray-300">Mrs. Thamaraiselvi K</span> · Assistant Professor</p>
          <p className="text-xs text-gray-500 mt-1">Dept: <span className="text-gray-300">Artificial Intelligence and Data Science</span></p>
        </div>
      </div>

      {/* Abstract */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <BookOpen size={15} className="text-gray-400" />
          <h2 className="font-semibold text-white text-sm">Abstract</h2>
        </div>
        <div className="card-body text-sm text-gray-400 leading-relaxed space-y-3">
          <p>Residential energy management is a critical challenge in modern smart grids, yet existing solutions often rely on expensive IoT hardware inaccessible to average households. This system implements a <strong className="text-white">Software-Defined Energy Management (SDEM)</strong> approach that utilizes a hybrid machine learning architecture combining Facebook Prophet and XGBoost.</p>
          <p>By processing historical TNEB consumption data, the system identifies <strong className="text-orange-400">Peak Hours</strong> and <strong className="text-green-400">Eco Hours</strong>, allowing users to shift loads strategically. The proposed framework achieves an accuracy of <strong className="text-white">92.4%</strong> in demand forecasting. Experimental results demonstrate that voluntary load shifting can reduce monthly electricity expenses by up to <strong className="text-green-400">22%</strong>.</p>
        </div>
      </div>

      {/* Key features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Brain, title: 'Hybrid AI Model', desc: 'Prophet captures seasonal trends + XGBoost handles nonlinear patterns. 92.4% accuracy, RMSE 0.43 kWh.', color: 'blue' },
          { icon: Zap, title: 'No IoT Required', desc: 'Software-defined approach — works with just meter readings and the TNEB Kaggle dataset.', color: 'green' },
          { icon: Leaf, title: 'Cost Savings', desc: 'Up to 22% bill reduction through load shifting from Peak to Eco Hours.', color: 'orange' },
        ].map((f, i) => (
          <div key={i} className={`card p-5 border-t-2 ${f.color === 'blue' ? 'border-blue-500' : f.color === 'green' ? 'border-green-500' : 'border-orange-500'}`}>
            <f.icon size={20} className={`mb-3 ${f.color === 'blue' ? 'text-blue-400' : f.color === 'green' ? 'text-green-400' : 'text-orange-400'}`} />
            <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="card">
        <div className="card-header"><h2 className="font-semibold text-white text-sm">Tech Stack</h2></div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              { layer: 'Frontend', tech: 'React 18 + Vite + Tailwind CSS', detail: 'Interactive dashboard with Recharts' },
              { layer: 'Backend', tech: 'Node.js + Express', detail: 'RESTful API, CSV parser, ML predictions' },
              { layer: 'Database', tech: 'PostgreSQL', detail: 'Time-series energy readings storage' },
              { layer: 'ML — Trend', tech: 'Prophet (Facebook)', detail: 'Seasonal decomposition, macro trends' },
              { layer: 'ML — Residual', tech: 'XGBoost', detail: 'Nonlinear patterns, feature regression' },
              { layer: 'Dataset', tech: 'TNEB Hourly Readings', detail: 'Kaggle · pythonafroz · Coimbatore' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500">{t.layer}</p>
                <p className="text-white font-medium text-sm mt-0.5">{t.tech}</p>
                <p className="text-xs text-gray-600 mt-0.5">{t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset link */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">Tamil Nadu Electricity Board Hourly Readings</p>
          <p className="text-gray-500 text-xs mt-0.5">Kaggle Dataset · pythonafroz · Used for model training and validation</p>
        </div>
        <a href="https://www.kaggle.com/datasets/pythonafroz/tamilnadu-electricity-board-hourly-readings"
          target="_blank" rel="noopener noreferrer" className="btn-outline text-xs shrink-0">
          <ExternalLink size={12} /> View on Kaggle
        </a>
      </div>
    </div>
  )
}
