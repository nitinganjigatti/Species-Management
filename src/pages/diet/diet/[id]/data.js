export const schedule = [
  {
    startTime: '07:01 AM',
    endTime: '12:00 PM',
    items: [
      {
        category: 'Vegetables',
        ingredient: [
          { name: 'Carrots', percentage: '20%' },
          { name: 'Cucumber', percentage: '20%' },
          { name: 'Tomato', percentage: '20%' },
          { name: 'Green Peas', percentage: '20%' },
          { name: 'Broccoli', percentage: '20%' }
        ],
        remarks: 'Unchopped',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { common: '1 KG', male: '3 KG', female: '6 KG', kid: '1 KG' }
      },
      {
        category: 'Fruits',
        ingredient: [
          { name: 'Apple', percentage: '20%' },
          { name: 'Orange', percentage: '20%' },
          { name: 'Pineapple', percentage: '20%' },
          { name: 'Watermelon', percentage: '20%' },
          { name: 'Grapes', percentage: '20%' }
        ],
        remarks: 'Unchopped',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { common: '1 KG', male: '1 KG', female: '1 KG', kid: '1 KG' }
      },
      {
        category: 'Eggs',
        preparationType: 'Boiled',
        remarks: 'Boiled Egg white & Egg yolk with shell',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { common: '1 KG', male: '1 KG', female: '1 KG', kid: '1 KG' }
      },
      {
        category: 'Bread With Honey',
        remarks: 'Dried dates if fresh dates are out of season',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { common: '1 KG', male: '1 KG', female: '1 KG', kid: '1 KG' }
      }
    ]
  },
  {
    startTime: '12:01 PM',
    endTime: '03:00 PM',
    items: [
      {
        category: 'coconut',
        preparationType: 'Open',
        days: ['Sun'],
        mealCategory: { common: '1 KG', male: '1 KG', female: '1 KG', kid: '1 KG' }
      }
    ]
  },
  {
    startTime: '03:01 PM',
    endTime: '06:00 PM',
    items: [
      {
        category: 'Daliya',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { male: '1 KG', female: '1 KG', kid: '1 KG' }
      },
      {
        category: 'Vegetables',
        ingredient: [
          { name: 'Carrots', percentage: '20%' },
          { name: 'Cucumber', percentage: '20%' },
          { name: 'Tomato', percentage: '20%' },
          { name: 'Green Peas', percentage: '20%' },
          { name: 'Broccoli', percentage: '20%' }
        ],
        remarks: 'Unchopped',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { common: '1 KG', female: '1 KG', kid: '1 KG' }
      },
      {
        category: 'Fruits',
        ingredient: [
          { name: 'Apple', percentage: '20%' },
          { name: 'Orange', percentage: '20%' },
          { name: 'Pineapple', percentage: '20%' },
          { name: 'Watermelon', percentage: '20%' },
          { name: 'Grapes', percentage: '20%' }
        ],
        remarks: 'Unchopped',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { common: '1 KG', male: '1 KG', female: '1 KG' }
      },
      {
        category: 'Chicken',
        preparationType: 'Dressed',
        remarks: 'Dressed, boneless',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        mealCategory: { common: '1 KG', male: '1 KG', female: '1 KG', kid: '1 KG' }
      }
    ]
  }
]
