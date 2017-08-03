import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import { Menu, Icon, Alert } from 'antd'
const SubMenu = Menu.SubMenu
// const ItemGroup = Menu.ItemGroup
const Item = Menu.Item
const ItemGroup = Menu.ItemGroup

const keyserver = 'http://itconnect.uw.edu/wares/acquiring-software-and-hardware/keyserver-help-for-it-staff/'

import styles from './Nav.css'
@connect(state => ({
  //  NOTE: Do NOT try refactoring this selector. This is isomorphically generated, more specific selectors will break.
  routing: state.routing,
  stf: (state.user && state.user.stf) || {}
}))
class Nav extends React.Component {
  render ({ routing, stf } = this.props) {
    const location = routing.locationBeforeTransitions ? routing.locationBeforeTransitions.pathname : '1'
    return (
      <Menu mode='inline'
        // defaultSelectedKeys={['1']}
        defaultOpenKeys={['/sub1']}
        selectedKeys={[location]}
        onClick={(i) => i.key && browserHistory.push(i.key)}
      >
        {Object.keys(stf).length > 0 && // if associated in any way with STF
          <SubMenu key='sub1' title={<span><Icon type='safety' /><span>Committee</span></span>}>
            <Item key='/knowledge'>
              <Icon type='book' /><span className='nav-text'>Knowledge Base</span>
            </Item>
            <ItemGroup key='g1' title='Members'>
              {/* <Item key='/dashboard'>
                <Icon type='team' /><span className='nav-text'>Dashboard</span>
              </Item> */}
              <Item key='/voting'>
                <Icon type='check' /><span className='nav-text'>Voting</span>
              </Item>
            </ItemGroup>
            {stf.admin &&
              <ItemGroup key='g2' title='Admins'>
                <Item key='/docket'>
                  <Icon type='schedule' /><span className='nav-text'>Docket</span>
                </Item>
                <Item key='/config'>
                  <Icon type='setting' /><span className='nav-text'>Site Config</span>
                </Item>
              </ItemGroup>
            }
          </SubMenu>
        }
        <Item key='/proposals'>
          <Icon type='solution' /><span className='nav-text'>Proposals</span>
        </Item>
        <Item key='/blocks'>
          <Icon type='desktop' /><span className='nav-text'>Block Funding</span>
        </Item>
        <Item key='/faq'>
          <Icon type='question' /><span className='nav-text'>F.A.Q.</span>
        </Item>
        <Item key='/about'>
          <Icon type='info' /><span className='nav-text'>About</span>
        </Item>
        <Item key='/contact'>
          <Icon type='team' /><span className='nav-text'>Contact Us</span>
        </Item>
        <SubMenu key='sub2' title={<span><Icon type='folder-open' /><span>Documents</span></span>}>
          <Item key='/documents'>Commitee Docs</Item>
          <Item key='/docs/Current Request for Proposals.pdf' >Request for Proposals</Item>
          <Item key=''>
            <a href={keyserver} target='_blank'>License Keyserver</a>
          </Item>
        </SubMenu>

        <Alert type='info' banner showIcon
          message='Meetings'
          description={<span>Every Monday<br />3:30 - 5:30PM<br />HUB 305</span>}
        />
      </Menu>
    )
  }
}
Nav.propTypes = {
  // user: PropTypes.object
}
export default Nav
