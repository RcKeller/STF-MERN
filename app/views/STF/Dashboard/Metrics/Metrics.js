//  React and its typechecking
import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
//  Redux utils
import { compose } from 'redux'
import { connect } from 'react-redux'
import { connectRequest } from 'redux-query'
//  Our API services
import api from '../../../../services'
import { Loading } from '../../../../components'

import { Link } from 'react-router'
import { Table, Progress, Badge, Input, Icon } from 'antd'

//  At this scale, cents are triffling
const currency = number => `$${Number.parseInt(number).toLocaleString('en-US')}`

  //  Create an array of years for select boxes
const years = _.range(
  2000,
  new Date().getFullYear() + 1
)

//  Status indicator mapping for badge components
const indicators = {
  'Submitted': 'default',
  'Funded': 'success',
  'Partially Funded': 'warning',
  'In Review': 'warning',
  'Awaiting Decision': 'warning',
  'Denied': 'error',
  'Draft': 'error',
  'Withdrawn': 'error'
}

/*
SUPPLEMENTALS FEATURE:
Summary of all supplemental requests
Useful for operations / Proposal Officer
*/
@compose(
  connect((state, props) => ({
    metrics: (state.db.metrics || []).filter(budget => budget.proposal),
    enums: state.config.enums,
    screen: state.screen,
    user: state.user
  })),
  connectRequest(
    () => api.get('manifests', {
      // query: { type: 'supplemental' },
      // query for >0 reviews in array
      populate: [
        'reviews',
        { path: 'proposal' }
        // select: ['year', 'number', 'title', 'asked']
      ],
      transform: metrics => ({ metrics }),
      update: ({ metrics: (prev, next) => next }),
      force: true
    })
  )
)
class Metrics extends React.Component {
  static propTypes = {
    metrics: PropTypes.array,
    screen: PropTypes.object,
    user: PropTypes.object
  }
  static defaultProps = {
    metrics: [],
    screen: {},
    user: {}
  }
  constructor (props) {
    super(props)
    const { metrics } = this.props
    this.state = {
      metrics,
      filterDropdownVisible: false,
      searchText: '',
      filtered: false
    }
  }
  componentWillReceiveProps (nextProps) {
    const { metrics } = nextProps
    if (metrics) this.setState({ metrics })
  }

  onInputChange = searchText => this.setState({ searchText })
  onSearch = () => {
    const { searchText } = this.state
    const { metrics } = this.props
    const reg = new RegExp(searchText, 'gi')
    this.setState({
      filterDropdownVisible: false,
      filtered: !!searchText,
      metrics: metrics
        .map(record => {
          const match = record.proposal.title.match(reg)
          if (!match) return null
          return {
            ...record,
            title: (
              <span>
                {record.proposal.title
                  .split(reg).map((text, i) => i > 0
                      ? [(<span className='highlight'>{match[0]}</span>), text]
                      : text
                  )}
              </span>
            )
          }
        })
        .filter(record => !!record)
    })
  }
  render (
    { enums, screen } = this.props,
    { metrics } = this.state
  ) {
    const columns = [
      {
        title: 'ID',
        dataIndex: 'proposal.number',
        key: 'proposal.number',
        render: (text, record) => (
          <span id={record._id} >{`${record.proposal.year}-${record.proposal.number}`}</span>
        ),
        sorter: (a, b) =>
          a.proposal.year * a.proposal.number - b.proposal.year * b.proposal.number,
        filters: years.map((year, i) => {
          return { text: year, value: year }
        }),
        onFilter: (value, record) =>
          record.proposal.year.toString().includes(value),
        width: 80
      }, {
        title: 'Q',
        dataIndex: 'proposal.quarter',
        key: 'quarter',
        render: text => <span>{text.substr(0, 2) || ''}</span>,
        filters: [
          { text: 'Autumn', value: 'Autumn' },
          { text: 'Fall', value: 'Fall' },
          { text: 'Spring', value: 'Spring' },
          { text: 'Summer', value: 'Summer' }
        ],
        onFilter: (value, record) => record.proposal.quarter.includes(value),
        width: 60
      }, {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: text => <span>{_.capitalize(text)}</span>,
        filters: [
          { text: 'Original Proposal', value: 'original' },
          { text: 'Supplemental Award', value: 'supplemental' },
          { text: 'Partial Funding', value: 'partial' }
        ],
        onFilter: (value, record) => record.type.includes(value),
        width: 120
      }, {
        title: 'Title',
        dataIndex: 'proposal.title',
        key: 'proposal.title',
        render: (text, record) => (
          <span>
            <Link to={`/proposals/${record.proposal.year}/${record.proposal.number}`}>
              {record.proposal.title}
            </Link>
            {record.title && <div>
              <hr />
              <em>{record.title}</em>
            </div>}
          </span>
        ),
        filterDropdown: (
          <Input
            ref={ele => this.searchInput = ele}
            placeholder='Search title'
            value={this.state.searchText}
            onChange={(e) => this.onInputChange(e.target.value)}
            onPressEnter={this.onSearch}
          />
        ),
        filterIcon: <Icon type='search' style={{ color: this.state.filtered ? '#108ee9' : '#aaa' }} />,
        filterDropdownVisible: this.state.filterDropdownVisible,
        onFilterDropdownVisibleChange: visible => {
          this.setState(
            { filterDropdownVisible: visible },
            () => this.searchInput.focus()
          )
        }
      },
      {
        title: 'Organization',
        dataIndex: 'proposal.organization',
        key: 'proposal.organization',
        render: (text, record) => (
          <span>
            {text}
            <br />
            <em>{record.proposal.budget}</em>
          </span>
        ),
        filters: enums
          ? Object.keys(enums.organizations).map(org => {
            return { text: org, value: org }
          })
          : [],
        onFilter: (value, record) => record.proposal.organization === value
      },
      {
        title: 'Category',
        dataIndex: 'proposal.category',
        key: 'proposal.category',
        filters: enums
          ? enums.categories.map(category => {
            return { text: category, value: category }
          })
          : [],
        onFilter: (value, record) => record.proposal.category === value,
        width: 150
      }, {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        render: (text, record) => (
          <span>
            {text ? currency(text) : '$0'}
            <br />
            <Badge status={indicators[record.proposal.status] || 'default'} text={record.proposal.status.split(' ')[0]} />
          </span>
        ),
        width: 120,
        sorter: (a, b) => a.manifest.total - b.manifest.total,
        filters: enums
          ? enums.statuses.map(status => {
            return { text: status, value: status }
          })
          : [],
        onFilter: (value, record) => record.proposal.status === value
      }, {
        title: 'Status',
        dataIndex: 'reviews',
        key: 'for',
        filters: enums
          ? enums.statuses.map(status => {
            return { text: status, value: status }
          })
          : [],
        onFilter: (value, record) => record.proposal.status === value,
        render: (text, record) => {
          const hasReviews = (Array.isArray(text) && text.length > 0) || false
          const votesFor = hasReviews
            ? text.filter(review => review.approved === true)
            : 0
          const votesAgainst = hasReviews
            ? text.filter(review => review.approved === false)
            : 0
          return (
            <div>
              <Badge
                status={indicators[record.proposal.status] || 'default'}
                text={record.proposal.status.split(' ')[0]}
              />
              <br />
              <b>
                {(votesFor + votesAgainst > 0) && `${votesFor} / ${votesAgainst} (${text.length})`}
              </b>
            </div>
          )
        },
        width: 120
      }, {
        title: 'Avg. Score',
        dataIndex: 'reviews',
        key: 'avg.score',
        render: (text) => {
          const averageScore = Array.isArray(text) && text.reduce(
            (accumulator, review) => {
              const average = review.ratings && review.ratings.reduce(
                (accumulator, metric) => accumulator + (metric.score || 0),
                0
              ) / review.ratings.length
              return accumulator + average
            },
            0
          ) / text.length
          return (
            <span>{!Number.isNaN(averageScore) && averageScore}</span>
          )
        },
        width: 120
        // sorter: (a, b) => a.manifest.total - b.manifest.total,
      }
    ]
    return (
      <section>
        <Loading render={Array.isArray(metrics) && metrics.length > 0}
          title='Suppplementals'
          tip='Loading Supplemental Requests...'
        >
          <div>Loaded</div>
          <Table
            dataSource={metrics}
            sort
            size={screen.lessThan.medium ? 'small' : 'middle'}
            columns={columns}
            rowKey={record => record._id}
          />
        </Loading>
      </section>
    )
  }
}
export default Metrics