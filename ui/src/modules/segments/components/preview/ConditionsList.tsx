import Button from 'modules/common/components/Button';
import { FlexRightItem } from 'modules/layout/styles';
import PropertyCondition from 'modules/segments/containers/form/PropertyCondition';
import { IField, ISegmentCondition, ISegmentMap } from 'modules/segments/types';
import { __ } from 'modules/common/utils';
import React from 'react';
import {
  Condition,
  ConditionItem,
  ConjunctionButtons,
  ConjunctionButtonsVertical,
  FilterRow,
  SegmentBackIcon,
  ConditionGroup
} from '../styles';
import ConditionDetail from '../../containers/preview/ConditionDetail';
import PropertyForm from '../form/PropertyForm';
import Icon from 'modules/common/components/Icon';
import Tip from 'modules/common/components/Tip';

type Props = {
  segment: ISegmentMap;
  contentType: string;
  conditionsConjunction: string;
  index: number;
  changeConditionsConjunction: (value: string) => void;
  addCondition: (
    condition: ISegmentCondition,
    segmentKey: string,
    boardId?: string,
    pipelineId?: string
  ) => void;
  addNewProperty: (segmentKey: string) => void;
  removeCondition: (key: string, segmentKey?: string) => void;
  removeSegment: (segmentKey: string) => void;
  onClickBackToList: () => void;
  changeSubSegmentConjunction: (
    segmentKey: string,
    conjunction: string
  ) => void;
  onClickField?: (field, condition) => void;
  chosenField?: IField;
  chosenCondition?: ISegmentCondition;
  isAutomation: boolean;
  boardId: string;
  pipelineId: string;
};

type State = {};

class ConditionsList extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = { chosenField: undefined, chosenCondition: undefined };
  }

  onClickField = (field, condition) => {
    if (this.props.onClickField) {
      return this.props.onClickField(field, condition);
    }

    return;
  };

  addProperty = () => {
    const { segment, addNewProperty } = this.props;
    return addNewProperty(segment.key);
  };

  removeCondition = condition => {
    const { removeCondition, segment } = this.props;

    return removeCondition(condition.key, segment.key);
  };

  removeSegment = () => {
    const { removeSegment, segment } = this.props;

    return removeSegment(segment.key);
  };

  renderConjunction = () => {
    const {
      conditionsConjunction,
      index,
      changeConditionsConjunction
    } = this.props;

    if (index === 0) {
      return <></>;
    }

    const onClickAnd = () => {
      changeConditionsConjunction('and');
    };

    const onClickOr = () => {
      changeConditionsConjunction('or');
    };

    let btnStyleAnd = 'default';
    let btnSyleOr = 'simple';

    if (conditionsConjunction === 'or') {
      btnStyleAnd = 'simple';
      btnSyleOr = 'default';
    }

    return (
      <ConjunctionButtons>
        <Button.Group hasGap={false}>
          <Button size="small" onClick={onClickAnd} btnStyle={btnStyleAnd}>
            {__('And')}
          </Button>
          <Button size="small" onClick={onClickOr} btnStyle={btnSyleOr}>
            {__('Or')}
          </Button>
        </Button.Group>
      </ConjunctionButtons>
    );
  };

  renderSubSegmentConjunction = () => {
    const { segment, changeSubSegmentConjunction } = this.props;
    const { conditionsConjunction, conditions } = segment;

    if (conditions && conditions.length <= 1) {
      return <></>;
    }

    const onClickAnd = () => {
      changeSubSegmentConjunction(segment.key, 'and');
    };

    const onClickOr = () => {
      changeSubSegmentConjunction(segment.key, 'or');
    };

    let btnStyleAnd = 'default';
    let btnSyleOr = 'simple';

    if (conditionsConjunction === 'or') {
      btnStyleAnd = 'simple';
      btnSyleOr = 'default';
    }

    return (
      <ConjunctionButtonsVertical>
        <Button.Group hasGap={false}>
          <Button size="small" onClick={onClickOr} btnStyle={btnSyleOr}>
            <span>Or</span>
          </Button>
          <Button size="small" onClick={onClickAnd} btnStyle={btnStyleAnd}>
            <span>And</span>
          </Button>
        </Button.Group>
      </ConjunctionButtonsVertical>
    );
  };

  renderCondition(condition: ISegmentCondition) {
    const { segment } = this.props;
    const { conditions } = segment;

    let useMargin = true;

    if (conditions && conditions.length <= 1) {
      useMargin = false;
    }

    return (
      <ConditionItem useMargin={useMargin} key={Math.random()}>
        <FilterRow>
          <ConditionDetail
            onClickField={this.onClickField}
            condition={condition}
            pipelineId={segment.pipelineId}
            segmentId={segment._id}
          />

          <FlexRightItem>
            <div onClick={this.removeCondition.bind(this, condition)}>
              <Icon icon="times" size={16} />
            </div>
          </FlexRightItem>
        </FilterRow>
      </ConditionItem>
    );
  }

  render() {
    const {
      segment,
      index,
      addCondition,
      chosenField,
      chosenCondition,
      onClickBackToList
    } = this.props;

    const { conditions } = segment;
    const hasCondition = conditions && conditions.length <= 1;

    if (conditions.length === 0 && index === 0) {
      return <PropertyCondition {...this.props} hideBackButton={true} />;
    }

    if (chosenField && chosenCondition) {
      return (
        <>
          <SegmentBackIcon onClick={onClickBackToList}>
            <Icon icon="angle-left" size={20} /> back
          </SegmentBackIcon>
          <PropertyForm
            field={chosenField}
            condition={chosenCondition}
            segment={segment}
            addCondition={addCondition}
          />
        </>
      );
    }

    return (
      <ConditionGroup>
        {this.renderConjunction()}

        <Condition hasCondition={hasCondition}>
          {this.renderSubSegmentConjunction()}
          {conditions.map(condition => {
            return this.renderCondition(condition);
          })}

          <Button
            size="small"
            btnStyle="simple"
            icon="add"
            onClick={this.addProperty}
          >
            Add property
          </Button>
        </Condition>

        <Tip text={'Delete'}>
          <Button
            btnStyle="simple"
            size="small"
            onClick={this.removeSegment}
            icon="times"
          />
        </Tip>
      </ConditionGroup>
    );
  }
}

export default ConditionsList;
